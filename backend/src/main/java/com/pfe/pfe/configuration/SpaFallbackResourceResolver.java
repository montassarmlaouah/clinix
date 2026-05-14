package com.pfe.pfe.configuration;

import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.resource.ResourceResolver;
import org.springframework.web.servlet.resource.ResourceResolverChain;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Pour une SPA servie depuis {@code classpath:/static/}, renvoie {@code index.html} pour les
 * routes client (GET sans fichier statique), sans intercepter les préfixes API ou fichiers manquants
 * avec extension.
 */
public class SpaFallbackResourceResolver implements ResourceResolver {

    @Override
    public Resource resolveResource(HttpServletRequest request, @NonNull String requestPath,
            @NonNull List<? extends Resource> locations, @NonNull ResourceResolverChain chain) {
        Resource resource = chain.resolveResource(request, requestPath, locations);
        if (resource != null) {
            return resource;
        }
        if (!"GET".equalsIgnoreCase(request.getMethod())) {
            return null;
        }
        String p = requestPath.startsWith("/") ? requestPath.substring(1) : requestPath;
        if (looksLikeFileWithExtension(p)) {
            return null;
        }
        if (p.startsWith("api/")
                || p.startsWith("auth/verifier-compte")
                || p.startsWith("auth/verifier-telephone")
                || p.startsWith("auth/diagnostic")
                || p.startsWith("v3/")
                || p.startsWith("swagger-ui")) {
            return null;
        }
        return chain.resolveResource(request, "index.html", locations);
    }

    private static boolean looksLikeFileWithExtension(String path) {
        int slash = path.lastIndexOf('/');
        String last = slash >= 0 ? path.substring(slash + 1) : path;
        return last.contains(".") && !last.endsWith(".html");
    }

    @Override
    public String resolveUrlPath(String resourcePath, @NonNull List<? extends Resource> locations,
            @NonNull ResourceResolverChain chain) {
        return chain.resolveUrlPath(resourcePath, locations);
    }
}
