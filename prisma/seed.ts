import { PrismaClient, UserRole, AttendanceSessionStatus, VerificationMethod } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
	const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD;

	if (!seedAdminPassword || seedAdminPassword.length < 12) {
		throw new Error("SEED_ADMIN_PASSWORD must be set and contain at least 12 characters.");
	}

	const adminPasswordHash = await bcrypt.hash(seedAdminPassword, 12);

	const department = await prisma.department.upsert({
		where: { code: "COMP-SCI" },
		update: { name: "Computer Science" },
		create: { code: "COMP-SCI", name: "Computer Science" },
	});

	await prisma.user.upsert({
		where: { email: "admin@example.edu" },
		update: {
			fullName: "System Administrator",
			role: UserRole.ADMIN,
			isActive: true,
			passwordHash: adminPasswordHash,
		},
		create: {
			email: "admin@example.edu",
			fullName: "System Administrator",
			passwordHash: adminPasswordHash,
			role: UserRole.ADMIN,
		},
	});

	const lecturerUser = await prisma.user.upsert({
		where: { email: "lecturer@example.edu" },
		update: { fullName: "Demo Lecturer", role: UserRole.LECTURER, isActive: true },
		create: {
			email: "lecturer@example.edu",
			fullName: "Demo Lecturer",
			passwordHash: adminPasswordHash,
			role: UserRole.LECTURER,
		},
	});

	const lecturer = await prisma.lecturer.upsert({
		where: { userId: lecturerUser.id },
		update: { staffNumber: "STAFF-001", departmentId: department.id },
		create: {
			userId: lecturerUser.id,
			staffNumber: "STAFF-001",
			departmentId: department.id,
		},
	});

	const studentUser = await prisma.user.upsert({
		where: { email: "student@example.edu" },
		update: { fullName: "Demo Student", role: UserRole.STUDENT, isActive: true },
		create: {
			email: "student@example.edu",
			fullName: "Demo Student",
			passwordHash: adminPasswordHash,
			role: UserRole.STUDENT,
		},
	});

	const student = await prisma.student.upsert({
		where: { userId: studentUser.id },
		update: {
			studentNumber: "STU-001",
			departmentId: department.id,
			programme: "Computer Science",
			level: "Level 1",
		},
		create: {
			userId: studentUser.id,
			studentNumber: "STU-001",
			departmentId: department.id,
			programme: "Computer Science",
			level: "Level 1",
		},
	});

	const course = await prisma.course.upsert({
		where: { code: "CSC101" },
		update: {
			title: "Introduction to Computer Science",
			departmentId: department.id,
			lecturerId: lecturer.id,
			isActive: true,
		},
		create: {
			code: "CSC101",
			title: "Introduction to Computer Science",
			departmentId: department.id,
			lecturerId: lecturer.id,
		},
	});

	await prisma.courseEnrollment.upsert({
		where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
		update: {},
		create: { studentId: student.id, courseId: course.id },
	});

	const sessionStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
	const sessionEnd = new Date(sessionStart.getTime() + 60 * 60 * 1000);

	await prisma.attendanceSession.upsert({
		where: { id: "00000000-0000-0000-0000-000000000101" },
		update: {
			title: "CSC101 Demo Session",
			courseId: course.id,
			createdByLecturerId: lecturer.id,
			startsAt: sessionStart,
			endsAt: sessionEnd,
			status: AttendanceSessionStatus.DRAFT,
			verificationMethods: [VerificationMethod.MANUAL, VerificationMethod.QR],
		},
		create: {
			id: "00000000-0000-0000-0000-000000000101",
			title: "CSC101 Demo Session",
			courseId: course.id,
			createdByLecturerId: lecturer.id,
			startsAt: sessionStart,
			endsAt: sessionEnd,
			verificationMethods: [VerificationMethod.MANUAL, VerificationMethod.QR],
		},
	});

	console.log("Development seed completed.");
	console.log("Admin email: admin@example.edu");
	console.log("All seeded demo accounts use SEED_ADMIN_PASSWORD.");
}

main()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
