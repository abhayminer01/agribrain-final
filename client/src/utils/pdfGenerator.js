import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateFieldAuditPDF = (field) => {
    const doc = new jsPDF();

    // Title and Header
    doc.setFontSize(24);
    doc.setTextColor(27, 94, 32); // Dark green
    doc.text("Agri Brain", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Intelligent Farm Management & AI Automation Platform.", 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);

    // Divider
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(14, 42, 196, 42);

    // Section 1: Field Info
    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text(`Field Audit: ${field.name}`, 14, 52);

    autoTable(doc, {
        startY: 58,
        head: [['Property', 'Details']],
        body: [
            ['Size', `${field.size} Acres`],
            ['Status', field.status ? field.status.charAt(0).toUpperCase() + field.status.slice(1) : 'Active'],
            ['Planted Crop', field.selectedCrop || 'None'],
            ['Planting Date', field.plantingDate ? new Date(field.plantingDate).toLocaleDateString() : 'Not Planted'],
            ['Est. Harvest Date', field.estimatedHarvestDate ? new Date(field.estimatedHarvestDate).toLocaleDateString() : 'N/A'],
            ['Est. Yield', field.estimatedYieldRaw ? `${field.estimatedYieldRaw} ${field.yieldUnit}` : 'N/A'],
            ...(field.status === 'harvested' ? [['Actual Yield', `${field.actualYield || 0} ${field.yieldUnit || ''}`]] : []),
            ...(field.status === 'failure' ? [['Failure Reason', field.failureReason || 'N/A']] : [])
        ],
        theme: 'grid',
        headStyles: { fillColor: [46, 125, 50] }
    });

    // Section 2: Soil Profile
    let currentY = doc.lastAutoTable.finalY + 15;
    if (field.soilData) {
        doc.setFontSize(16);
        doc.text("Soil Profile", 14, currentY);
        autoTable(doc, {
            startY: currentY + 6,
            head: [['pH Level', 'Nitrogen (N)', 'Phosphorus (P)', 'Potassium (K)']],
            body: [
                [
                    field.soilData.pH || '-', 
                    field.soilData.NPK?.N || '-', 
                    field.soilData.NPK?.P || '-', 
                    field.soilData.NPK?.K || '-'
                ]
            ],
            theme: 'grid',
            headStyles: { fillColor: [245, 124, 0] }
        });
        currentY = doc.lastAutoTable.finalY + 15;
    }

    // Section 3: Fertilization Schedule
    doc.setFontSize(16);
    doc.text("Fertilization Timeline", 14, currentY);
    
    const fertBody = field.fertilizationSchedule?.map(stage => {
        let dateStr = `Day +${stage.dayOffset}`;
        if (field.plantingDate) {
            const d = new Date(field.plantingDate);
            d.setDate(d.getDate() + stage.dayOffset);
            dateStr = d.toLocaleDateString();
        }
        return [
            stage.stageName,
            dateStr,
            stage.selectedType ? stage.selectedType.charAt(0).toUpperCase() + stage.selectedType.slice(1) : 'Not Selected',
            stage.status.charAt(0).toUpperCase() + stage.status.slice(1)
        ];
    }) || [];

    if (fertBody.length > 0) {
        autoTable(doc, {
            startY: currentY + 6,
            head: [['Stage', 'Target Date', 'Route', 'Status']],
            body: fertBody,
            theme: 'grid',
            headStyles: { fillColor: [27, 94, 32] }
        });
        currentY = doc.lastAutoTable.finalY + 15;
    } else {
        doc.setFontSize(11);
        doc.setTextColor(150);
        doc.text("No fertilization schedule available.", 14, currentY + 6);
        currentY += 15;
        doc.setTextColor(40);
    }

    // Section 4: Pest & Disease Diagnoses
    if (currentY > 250) {
        doc.addPage();
        currentY = 20;
    }
    
    doc.setFontSize(16);
    doc.text("Pest & Disease Scans", 14, currentY);

    if (field.diagnoses && field.diagnoses.length > 0) {
        const diagBody = field.diagnoses.map(diag => {
            const appliedSteps = diag.treatmentCourse?.filter(s => s.status === 'applied').length || 0;
            const totalSteps = diag.treatmentCourse?.length || 0;
            return [
                new Date(diag.diagnosedAt).toLocaleDateString(),
                diag.type === 'pest' ? 'Pest' : 'Disease',
                diag.name || 'Unknown',
                diag.severity || 'Unknown',
                `${appliedSteps}/${totalSteps} Steps done`
            ];
        });

        autoTable(doc, {
            startY: currentY + 6,
            head: [['Date', 'Type', 'Diagnosis', 'Severity', 'Treatment']],
            body: diagBody,
            theme: 'grid',
            headStyles: { fillColor: [198, 40, 40] }
        });
    } else {
        doc.setFontSize(11);
        doc.setTextColor(150);
        doc.text("No pest or disease history recorded.", 14, currentY + 6);
    }

    doc.save(`${field.name.replace(/\s+/g, '_')}_Audit.pdf`);
};
