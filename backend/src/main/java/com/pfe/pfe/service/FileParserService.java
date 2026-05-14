package com.pfe.pfe.service;

import net.sourceforge.tess4j.Tesseract;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

@Service
public class FileParserService {

    @Value("${tesseract.data.path:C:/Program Files/Tesseract-OCR/tessdata}")
    private String tessDataPath;

    public String parsePdf(MultipartFile file) throws IOException {
        File tmp = File.createTempFile("clinix_pdf_", ".pdf");
        file.transferTo(tmp);
        try (PDDocument doc = Loader.loadPDF(tmp)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        } finally {
            Files.deleteIfExists(tmp.toPath());
        }
    }

    public String parseImage(MultipartFile file) throws Exception {
        Tesseract ocr = new Tesseract();
        ocr.setDatapath(tessDataPath);
        ocr.setLanguage("fra");

        File tmp = File.createTempFile("clinix_ocr_", "_" + file.getOriginalFilename());
        file.transferTo(tmp);
        try {
            return ocr.doOCR(tmp);
        } finally {
            Files.deleteIfExists(tmp.toPath());
        }
    }
}
