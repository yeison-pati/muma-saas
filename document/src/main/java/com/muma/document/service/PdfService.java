package com.muma.document.service;

import java.io.ByteArrayOutputStream;

import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.stereotype.Service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

/**
 * Genera PDF a partir de HTML. Las URLs de imágenes se incrustan como base64
 * descargando desde MinIO, evitando el 403 de las URLs presignadas.
 */
@Service
@RequiredArgsConstructor
public class PdfService {

    private final ImageEmbedder imageEmbedder;

    /**
     * Convierte HTML a PDF. Las URLs de imágenes (/images/...) se reemplazan
     * por data URLs (base64) descargando el contenido desde S3/MinIO.
     *
     * @param html HTML con posibles img src apuntando a imágenes
     * @return PDF en bytes (Mono)
     */
    public Mono<byte[]> htmlToPdf(String html) {
        if (html == null || html.isBlank()) {
            return Mono.just(new byte[0]);
        }
        String embedded = imageEmbedder.embedImagesInHtml(html);
        return Mono.fromCallable(() -> renderToPdf(embedded))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /**
     * Versión que devuelve un DataBuffer para respuestas reactivas.
     */
    public Mono<DataBuffer> htmlToPdfBuffer(String html) {
        return htmlToPdf(html)
                .map(bytes -> DefaultDataBufferFactory.sharedInstance.wrap(bytes));
    }

    private byte[] renderToPdf(String html) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(out);
            builder.run();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generando PDF: " + e.getMessage(), e);
        }
    }
}
