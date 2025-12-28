import ssl
ssl._create_default_https_context = ssl._create_unverified_context
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
import insightface
from insightface.app import FaceAnalysis
import os
import io
from PIL import Image
import torch
import torch.nn.functional as F
from app.anti_spoofing import AntiSpoof

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Models
# InsightFace for Detection & Recognition
# providers = ['CUDAExecutionProvider'] if torch.cuda.is_available() else ['CPUExecutionProvider']
providers = ['CPUExecutionProvider'] # Force CPU for compatibility in generic envs
face_app = FaceAnalysis(name='buffalo_l', providers=providers)
face_app.prepare(ctx_id=0, det_size=(640, 640))

# Anti-Spoofing Model (MiniFASNet placeholder/wrapper)
spoof_model = AntiSpoof()

@app.get("/")
def read_root():
    return {"status": "ML Service Running"}

def read_image(file_bytes):
    image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

@app.post("/register")
async def register_face(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        img = read_image(contents)
        
        # 1. Detect Face
        faces = face_app.get(img)
        
        if len(faces) == 0:
            raise HTTPException(status_code=400, detail="No face detected")
        
        if len(faces) > 1:
            raise HTTPException(status_code=400, detail="Multiple faces detected. Please ensure only one person is in frame.")
            
        face = faces[0]
        
        # 0. Size check (Face must be prominent)
        bbox = face.bbox
        face_area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
        total_area = img.shape[0] * img.shape[1]
        if face_area / total_area < 0.15:
            raise HTTPException(status_code=400, detail="Face too small. Please move closer to the camera.")
            
        # 2. Extract Embedding
        embedding = face.embedding.tolist()
        
        return {
            "message": "Face registered successfully",
            "embedding": embedding,
            "face_location": face.bbox.tolist()
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/verify")
async def verify_face(
    file: UploadFile = File(...),
    registered_embedding: str = Form(...) 
):
    # registered_embedding is passed as a stringified JSON list from Node.js
    try:
        import json
        target_embedding = np.array(json.loads(registered_embedding))
        
        contents = await file.read()
        img = read_image(contents)
        
        # 1. Face Detection
        faces = face_app.get(img)
        
        if len(faces) == 0:
             return {"verified": False, "reason": "No face detected"}

        # Find the best face (closest to target)
        max_sim = -1
        best_face = None
        for face in faces:
            sim = np.dot(face.embedding, target_embedding) / (np.linalg.norm(face.embedding) * np.linalg.norm(target_embedding))
            if sim > max_sim:
                max_sim = sim
                best_face = face

        if not best_face:
             return {"verified": False, "reason": "Identity mismatch (No matching face found)"}

        # 2. Anti-Spoofing Check on Face Crop
        # We crop the face with a small margin for texture analysis
        bbox = best_face.bbox.astype(int)
        h, w, _ = img.shape
        # Add 10% margin
        margin = int(0.1 * (bbox[2] - bbox[0]))
        x1, y1 = max(0, bbox[0]-margin), max(0, bbox[1]-margin)
        x2, y2 = min(w, bbox[2]+margin), min(h, bbox[3]+margin)
        face_crop = img[y1:y2, x1:x2]

        is_real, spoof_score = spoof_model.check(face_crop)
        
        if not is_real:
             return {
                 "verified": False,
                 "reason": "Spoof detected (Liveness check failed)",
                 "spoof_score": spoof_score
             }
        
        # 3. Final Verification Result
        # ArcFace Threshold: 0.7 is a reliable balance for high-security.
        threshold = 0.7
        verified = bool(max_sim > threshold)
        
        print(f"DEBUG: Identity Verification - Similarity: {max_sim:.2f}, Threshold: {threshold}, Result: {verified}")
        
        return {
            "verified": verified,
            "similarity": float(max_sim),
            "spoof_score": float(spoof_score),
            "liveness_passed": True,
            "reason": "Success" if verified else f"Identity mismatch (score: {max_sim:.2f})"
        }

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recognize_batch")
async def recognize_batch(
    file: UploadFile = File(...),
    students_data: str = Form(...) # JSON list of {id, embedding}
):
    try:
        import json
        students = json.loads(students_data)
        
        contents = await file.read()
        img = read_image(contents)
        
        # 1. Detect & Extract all faces in group photo
        faces = face_app.get(img)
        
        if len(faces) == 0:
            return {"present_students": [], "message": "No faces detected in image"}
            
        detected_embeddings = [face.embedding for face in faces]
        
        present_students = []
        threshold = 0.7 # High security for bulk
        
        for student in students:
            target_emb = np.array(student['embedding'])
            found = False
            best_sim = -1
            
            for det_emb in detected_embeddings:
                sim = np.dot(target_emb, det_emb) / (np.linalg.norm(target_emb) * np.linalg.norm(det_emb))
                if sim > threshold and sim > best_sim:
                    best_sim = sim
                    found = True
            
            if found:
                present_students.append({
                    "student_id": student['id'],
                    "similarity": float(best_sim)
                })
                
        return {
            "present_students": present_students,
            "total_detected": len(faces)
        }

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
