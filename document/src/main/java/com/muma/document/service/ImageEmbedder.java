package com.muma.document.service;

import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.muma.document.config.app.AppProperties;

import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

/**
 * Reemplaza URLs de imágenes en HTML por data URLs (base64) descargando
 * directamente desde MinIO. Evita el 403 que ocurre cuando openhtmltopdf
 * intenta cargar URLs presignadas (firmadas para otro Host).
 */
@Service
@RequiredArgsConstructor
public class ImageEmbedder {

    private final S3Client s3Client;
    private final AppProperties appProperties;

    private static final Pattern IMG_SRC_PATTERN = Pattern.compile(
            "(src\\s*=\\s*[\"'])([^\"']+)([\"'])",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern IMAGES_PATH_PATTERN = Pattern.compile(
            ".*/images/([^?&\"']+).*",
            Pattern.CASE_INSENSITIVE);

    /**
     * Reemplaza todas las URLs de imágenes que apunten a /images/ por data URLs
     * embebidas, descargando el contenido desde S3/MinIO.
     */
    public String embedImagesInHtml(String html) {
        if (html == null || html.isEmpty()) {
            return html;
        }
        String bucket = appProperties.s3().buckets().images();
        if (bucket == null || bucket.isEmpty()) {
            return html;
        }

        Matcher matcher = IMG_SRC_PATTERN.matcher(html);
        StringBuffer sb = new StringBuffer(html.length());
        while (matcher.find()) {
            String url = matcher.group(2).trim();
            String key = extractKeyFromUrl(url);
            if (key != null && !key.isEmpty()) {
                String dataUrl = fetchAsDataUrl(bucket, key);
                if (dataUrl != null) {
                    matcher.appendReplacement(sb, Matcher.quoteReplacement(matcher.group(1) + dataUrl + matcher.group(3)));
                }
            }
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    private String extractKeyFromUrl(String url) {
        Matcher m = IMAGES_PATH_PATTERN.matcher(url);
        return m.matches() ? m.group(1).trim() : null;
    }

    private String fetchAsDataUrl(String bucket, String key) {
        try {
            GetObjectRequest req = GetObjectRequest.builder().bucket(bucket).key(key).build();
            try (ResponseInputStream<GetObjectResponse> stream = s3Client.getObject(req)) {
                byte[] bytes = stream.readAllBytes();
                String contentType = stream.response().contentType();
                if (contentType == null || contentType.isEmpty()) {
                    contentType = guessContentType(key);
                }
                String base64 = Base64.getEncoder().encodeToString(bytes);
                return "data:" + contentType + ";base64," + base64;
            }
        } catch (Exception e) {
            return null;
        }
    }

    private static String guessContentType(String key) {
        String lower = key.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }
}
