# ML Microservice for Face Attendance

This service handles Face Detection, Recognition, and Anti-Spoofing.

## Setup

1. **Install Python 3.8+**
2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   *Note: If you are on macOS with Apple Silicon, ensuring `onnxruntime` or `torch` works might require platform specific installation, but standard pip usually works.*

3. **Run the Service:**
   ```bash
   python main.py
   ```
   The service runs on `http://localhost:8000`.

## Endpoints

- `POST /register`: Accepts an image file. Returns standard 512-d embedding.
- `POST /verify`: Accepts an image file + `registered_embedding` (JSON list). Returns verification status.

## Models
- **InsightFace**: Uses `buffalo_l` model pack (automatically downloaded on first run to `~/.insightface`).
- **Anti-Spoofing**: Currently implements a texture-based heuristic. For production, ensure `MiniFASNetV2.pth` is placed in `app/weights/`.
