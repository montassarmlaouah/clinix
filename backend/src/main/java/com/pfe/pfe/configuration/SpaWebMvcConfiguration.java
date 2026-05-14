package com.pfe.pfe.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Sert l’interface web (build Expo export) depuis {@code classpath:/static/} avec repli SPA.
 * <p>
 * {@link Ordered#LOWEST_PRECEDENCE} : les contrôleurs REST (ordre 0) restent prioritaires sur
 * {@code /api/**}. Avec {@code spring.web.resources.add-mappings=false}, il n’y a pas de second
 * gestionnaire {@code /**} sans repli SPA (sinon 404 sur les routes client comme {@code /auth/login}).
 */
@Configuration
public class SpaWebMvcConfiguration implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        registry.setOrder(Ordered.LOWEST_PRECEDENCE);
        registry.addResourceHandler("/webjars/**")
                .addResourceLocations("classpath:/META-INF/resources/webjars/");
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new SpaFallbackResourceResolver());
    }
}
