package com.muma.document.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.muma.document.service.PdfService;

import lombok.AllArgsConstructor;
import reactor.core.publisher.Mono;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.ResponseEntity;

/**
 * Genera PDF a partir de HTML. El front puede enviar HTML con imágenes usando
 * la URL pública (ej. http://localhost:8000/images/...); el servicio reescribe
 * internamente a la URL de MinIO para que las imágenes se carguen en el PDF.
 */
@RestController
@RequestMapping("/mediaFile")
@AllArgsConstructor
public class PdfController {

    private final PdfService pdfService;

    /**
     * Cuerpo: HTML como texto plano o JSON con campo "html".
     * Las URLs de imágenes con la base pública se reescriben a la base interna.
     */
    @PostMapping(value = "/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public Mono<ResponseEntity<DataBuffer>> htmlToPdf(@RequestBody String body) {
        String html = body;
        if (body.trim().startsWith("{")) {
            // Intentar extraer "html" si viene como JSON
            int start = body.indexOf("\"html\"");
            if (start >= 0) {
                int valueStart = body.indexOf(":", start);
                if (valueStart >= 0) {
                    int quoteStart = body.indexOf("\"", valueStart + 1);
                    if (quoteStart >= 0) {
                        int quoteEnd = body.indexOf("\"", quoteStart + 1);
                        if (quoteEnd > quoteStart) {
                            html = body.substring(quoteStart + 1, quoteEnd)
                                    .replace("\\n", "\n")
                                    .replace("\\\"", "\"");
                        }
                    }
                }
            }
        }
        return pdfService.htmlToPdfBuffer(html)
                .map(buf -> ResponseEntity.ok()
                        .header("Content-Disposition", "attachment; filename=\"document.pdf\"")
                        .body(buf));
    }
}
