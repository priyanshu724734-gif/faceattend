import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import connectDB from '../config/db';

dotenv.config();

const seedData = async () => {
    await connectDB();

    try {
        console.log('Clearing database...');
        await User.deleteMany({});
        await Course.deleteMany({});
        await Enrollment.deleteMany({});

        console.log('Creating Faculty...');
        const faculty1 = await User.create({
            name: 'Dr. Alice Johnson',
            email: 'alice@university.edu',
            passwordHash: 'password123',
            role: 'FACULTY',
            isActive: true,
        });

        const faculty2 = await User.create({
            name: 'Prof. Bob Smith',
            email: 'bob@university.edu',
            passwordHash: 'password123',
            role: 'FACULTY',
            isActive: true,
        });

        console.log('Creating Courses...');
        const coursesData = [
            { courseCode: 'CS101', courseName: 'Intro to CS', classTiming: '10:00 AM - 11:00 AM', facultyId: faculty1._id },
            { courseCode: 'CS102', courseName: 'Data Structures', classTiming: '11:00 AM - 12:00 PM', facultyId: faculty1._id },
            { courseCode: 'CS103', courseName: 'Algorithms', classTiming: '01:00 PM - 02:00 PM', facultyId: faculty1._id },
            { courseCode: 'CH201', courseName: 'Organic Chemistry', classTiming: '09:00 AM - 10:00 AM', facultyId: faculty2._id },
            { courseCode: 'CH202', courseName: 'Inorganic Chemistry', classTiming: '10:00 AM - 11:00 AM', facultyId: faculty2._id },
            { courseCode: 'CH203', courseName: 'Physical Chemistry', classTiming: '02:00 PM - 03:00 PM', facultyId: faculty2._id },
        ];

        const courses = await Course.insertMany(coursesData);

        console.log('Creating Students...');
        const students = [];
        for (let i = 1; i <= 10; i++) {
            students.push({
                name: `Student ${i}`,
                enrollmentNumber: `STU2024${i.toString().padStart(3, '0')}`,
                passwordHash: 'password123',
                role: 'STUDENT',
                academicYear: '2024-2025',
                isActive: true,
            });
        }

        // Create students one by one to trigger pre-save hook for password
        const createdStudents = [];
        for (const s of students) {
            const student = await User.create(s);
            createdStudents.push(student);
        }

        console.log('Enrolling Students...');
        const enrollments = [];
        for (const student of createdStudents) {
            // Enroll in 3 random courses
            const shuffledCourses = courses.sort(() => 0.5 - Math.random());
            const selectedCourses = shuffledCourses.slice(0, 3);

            for (const course of selectedCourses) {
                enrollments.push({
                    studentId: student._id,
                    courseId: course._id,
                });
            }
        }

        await Enrollment.insertMany(enrollments);

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error}`);
        process.exit(1);
    }
};

seedData();
