import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function generateUserManual() {
    const pdfDoc = await PDFDocument.create();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const pageSize = [595.28, 841.89]; // A4 in points
    let page = pdfDoc.addPage(pageSize);
    const { width, height } = page.getSize();

    let y = height - 50;

    const checkNewPage = (neededHeight = 40) => {
        if (y - neededHeight < 50) {
            page = pdfDoc.addPage(pageSize);
            y = height - 50;
            // Draw top line for new page
            page.drawLine({
                start: { x: 50, y: height - 35 },
                end: { x: width - 50, y: height - 35 },
                thickness: 0.5,
                color: rgb(0.85, 0.85, 0.88),
            });
            page.drawText('AttendEase - Platform Operations & User Manual', {
                x: 50,
                y: height - 30,
                size: 8,
                font: fontOblique,
                color: rgb(0.5, 0.5, 0.55),
            });
        }
    };

    const drawHeader = () => {
        // Top banner background
        page.drawRectangle({
            x: 40,
            y: y - 55,
            width: width - 80,
            height: 65,
            color: rgb(0.31, 0.27, 0.9), // Indigo 600
        });

        page.drawText('ATTENDEASE PLATFORM USER MANUAL', {
            x: 60,
            y: y - 20,
            size: 16,
            font: fontBold,
            color: rgb(1, 1, 1),
        });

        page.drawText('Standard Operating Procedure & Official Platform Guidelines for Store Owners', {
            x: 60,
            y: y - 40,
            size: 9.5,
            font: fontRegular,
            color: rgb(0.9, 0.92, 1),
        });

        y -= 85;
    };

    const drawSection = (title) => {
        checkNewPage(45);
        y -= 10;
        page.drawText(title.toUpperCase(), {
            x: 50,
            y: y,
            size: 11,
            font: fontBold,
            color: rgb(0.25, 0.22, 0.75),
        });
        page.drawLine({
            start: { x: 50, y: y - 4 },
            end: { x: width - 50, y: y - 4 },
            thickness: 1,
            color: rgb(0.8, 0.82, 0.92),
        });
        y -= 18;
    };

    const drawParagraph = (text, indent = 50, isBold = false) => {
        const maxWidth = width - indent - 50;
        const font = isBold ? fontBold : fontRegular;
        const size = 9.5;
        const words = text.split(' ');
        let line = '';

        for (const word of words) {
            const testLine = line ? `${line} ${word}` : word;
            const textWidth = font.widthOfTextAtSize(testLine, size);
            if (textWidth > maxWidth && line) {
                checkNewPage(18);
                page.drawText(line, {
                    x: indent,
                    y: y,
                    size,
                    font,
                    color: rgb(0.18, 0.2, 0.25),
                });
                y -= 14;
                line = word;
            } else {
                line = testLine;
            }
        }
        if (line) {
            checkNewPage(18);
            page.drawText(line, {
                x: indent,
                y: y,
                size,
                font,
                color: rgb(0.18, 0.2, 0.25),
            });
            y -= 14;
        }
        y -= 4; // spacing
    };

    const drawBullet = (boldTitle, text) => {
        checkNewPage(24);
        page.drawText('•', {
            x: 55,
            y: y,
            size: 11,
            font: fontBold,
            color: rgb(0.31, 0.27, 0.9),
        });

        const fullText = `${boldTitle} ${text}`;
        drawParagraph(fullText, 70);
    };

    const drawAlertBox = (title, text, borderColor = rgb(0.85, 0.2, 0.2), bgColor = rgb(0.99, 0.94, 0.94)) => {
        checkNewPage(75);
        y -= 5;
        const boxHeight = 65;
        page.drawRectangle({
            x: 50,
            y: y - boxHeight + 10,
            width: width - 100,
            height: boxHeight,
            color: bgColor,
            borderColor: borderColor,
            borderWidth: 1,
        });

        page.drawText(title, {
            x: 65,
            y: y - 5,
            size: 10,
            font: fontBold,
            color: borderColor,
        });

        // Split text lines
        const words = text.split(' ');
        let line = '';
        let lineY = y - 22;
        for (const word of words) {
            const testLine = line ? `${line} ${word}` : word;
            if (fontRegular.widthOfTextAtSize(testLine, 8.5) > width - 135 && line) {
                page.drawText(line, {
                    x: 65,
                    y: lineY,
                    size: 8.5,
                    font: fontRegular,
                    color: rgb(0.25, 0.15, 0.15),
                });
                lineY -= 12;
                line = word;
            } else {
                line = testLine;
            }
        }
        if (line) {
            page.drawText(line, {
                x: 65,
                y: lineY,
                size: 8.5,
                font: fontRegular,
                color: rgb(0.25, 0.15, 0.15),
            });
        }

        y -= (boxHeight + 8);
    };

    // Build the Document
    drawHeader();

    drawSection('1. Platform Overview & System Hierarchy');
    drawParagraph('AttendEase provides high-integrity employee attendance tracking based on physical multi-location Wi-Fi verification and cryptographic single-device token binding.');
    drawBullet('Store Owners / Administrators:', 'Manage their respective outlets, configure branch Wi-Fi IPs, manage shift schedules, enroll employees, monitor live check-ins, and inspect monthly payroll attendance summaries.');
    drawBullet('Super Admin:', 'Platform governing authority that registers authorized store owners, allocates dynamic outlet quotas, sets monthly subscription fees, and verifies payment receipts.');

    drawSection('2. Store Setup & Multi-Location Outlets');
    drawParagraph('Every store can operate multiple physical branches or outlets within the quota assigned by Super Admin:');
    drawBullet('Configuring Outlets:', 'Navigate to Store Settings > Outlets. Click "Add Outlet" to define the outlet name and its registered router IPv4 address.');
    drawBullet('Dynamic Outlets Quota:', 'The maximum number of outlets a store can create is dynamically managed by the Super Admin. If you need more outlets, contact the platform management.');

    drawSection('3. Employee Enrollment & Secure Device Binding');
    drawParagraph('To prevent proxy attendance and buddy punching, AttendEase enforces cryptographic hardware device tokens:');
    drawBullet('Adding Employees:', 'From the Employee Management page, add employee personal details, assigned outlet, and shift starting/closing hours.');
    drawBullet('Device Activation Link:', 'Each new employee receives an individual verification QR code and secure link. Opening this link from the employee\'s personal smartphone locks their attendance profile to that exact physical phone.');

    drawSection('4. Daily Attendance & Check-In Workflow');
    drawParagraph('Employees check in every morning and check out in the evening through the Attendance Portal:');
    drawBullet('Dual-Layer Verification:', 'The system instantly confirms that (1) the device hardware token matches the verified phone, and (2) the network IP matches the store branch\'s authorized office Wi-Fi.');
    drawBullet('Human-Readable Logs:', 'Late arrival, early leave, and overtime duration are computed automatically and logged in human-readable hours and minutes (e.g. +1h 24m).');

    drawSection('5. Subscription Billing, Payment Deadline & Service Suspension');
    drawParagraph('Stores operate on a monthly software subscription model:');
    drawBullet('Payment Due Date:', 'Store owners must clear their monthly subscription fee by the designated deadline (default: 7th of the current month, or the custom day configured by Super Admin).');
    drawBullet('Payment Channels:', 'Invoices can be paid using Super Admin\'s configured receiving accounts: bKash, Nagad, or Bank Transfer.');
    drawBullet('Submission & Verification:', 'Store owners submit their Transaction ID (TrxID) and paid amount from the Store Invoices portal. Once verified by Super Admin, active service status continues.');

    drawAlertBox(
        'WARNING: SERVICE SUSPENSION POLICY',
        'If an unpaid invoice is not cleared by the monthly deadline day (e.g., 7th of the month), all employee attendance services are immediately suspended. Employees attempting to check in or out will be redirected to the Service Suspended page.'
    );

    drawSection('6. Super Admin Rights, Delinquency & Permanent Store Termination');
    drawParagraph('To protect platform integrity and prevent abandoned storage consumption, strict delinquency policies apply:');
    drawBullet('Suspension Period:', 'A suspended store remains locked until the outstanding monthly invoice is submitted and verified by Super Admin.');

    drawAlertBox(
        'CRITICAL POLICY: OVERDUE DEFAULT & COMPLETE STORE REMOVAL',
        'If a store owner remains in overdue status for more than one month without clearing subscription fees, the platform holds the absolute legal and operational right to terminate the store owner completely. Upon deletion by Super Admin, all store records—including employees, outlets, attendance history, and uploaded files—will be permanently and irreversibly purged from the system.',
        rgb(0.75, 0.1, 0.1),
        rgb(0.99, 0.92, 0.92)
    );

    drawSection('7. Support & Contact');
    drawParagraph('If you require assistance, plan upgrades, outlet quota extensions, or billing clarification, please submit an inquiry via the Contact form in the website footer or reach out to the platform administration.');

    // Save PDF file
    const pdfBytes = await pdfDoc.save();
    const publicStorageDir = path.resolve('public', 'docs');
    if (!fs.existsSync(publicStorageDir)) {
        fs.mkdirSync(publicStorageDir, { recursive: true });
    }
    const outputPath = path.join(publicStorageDir, 'user-manual.pdf');
    fs.writeFileSync(outputPath, pdfBytes);
    console.log(`User Manual PDF generated successfully at: ${outputPath}`);
}

generateUserManual().catch(err => {
    console.error('Error generating PDF:', err);
    process.exit(1);
});

