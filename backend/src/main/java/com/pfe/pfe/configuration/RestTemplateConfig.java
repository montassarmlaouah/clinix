package com.pfe.pfe.configuration;

import javax.net.ssl.SSLContext;

import org.apache.hc.client5.http.classic.HttpClient;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.client5.http.io.HttpClientConnectionManager;
import org.apache.hc.client5.http.ssl.ClientTlsStrategyBuilder;
import org.apache.hc.client5.http.ssl.NoopHostnameVerifier;
import org.apache.hc.core5.ssl.SSLContexts;
import org.apache.hc.core5.ssl.TrustStrategy;
import org.apache.hc.core5.util.Timeout;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * {@link RestTemplate} générique + client dédié TunisieSMS.
 * <p>
 * Erreur « No name matching mystudents.tunisiesms.tn » : ce n’est pas un problème DNS,
 * c’est la <strong>vérification du certificat TLS</strong> (le nom dans le certificat ne
 * correspond pas au nom d’hôte). En dev, {@code tunisiesms.ssl.insecure-trust-all=true}
 * utilise Apache HttpClient 5 avec {@link NoopHostnameVerifier} (plus fiable que le seul {@code java.net.http.HttpClient} du JDK sur certains postes).
 */
@Configuration
public class RestTemplateConfig {

    private static final Logger log = LoggerFactory.getLogger(RestTemplateConfig.class);

    public static final String TUNISIE_SMS_REST_TEMPLATE = "tunisieSmsRestTemplate";

    @Bean
    @Primary
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean(name = TUNISIE_SMS_REST_TEMPLATE)
    public RestTemplate tunisieSmsRestTemplate(
            @Value("${tunisiesms.ssl.insecure-trust-all:false}") boolean insecureTrustAll) {
        if (!insecureTrustAll) {
            return new RestTemplate();
        }
        log.warn(
                "[TunisieSMS] tunisiesms.ssl.insecure-trust-all=true — Apache HttpClient 5, trust-all + NoopHostnameVerifier (dev uniquement).");
        try {
            HttpClient apache = buildInsecureApacheHttpClient();
            HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory(apache);
            return new RestTemplate(factory);
        } catch (Exception e) {
            throw new IllegalStateException(
                    "Impossible d'initialiser le RestTemplate TunisieSMS (ssl.insecure-trust-all)", e);
        }
    }

    /**
     * Trust all + pas de vérif hostname (contourne « No name matching … » côté JVM).
     */
    private static HttpClient buildInsecureApacheHttpClient() throws Exception {
        TrustStrategy trustAll = (chain, authType) -> true;
        SSLContext sslContext = SSLContexts.custom()
                .loadTrustMaterial(null, trustAll)
                .build();

        HttpClientConnectionManager cm = PoolingHttpClientConnectionManagerBuilder.create()
                .setTlsSocketStrategy(ClientTlsStrategyBuilder.create()
                        .setSslContext(sslContext)
                        .setHostnameVerifier(NoopHostnameVerifier.INSTANCE)
                        .buildClassic())
                .build();

        RequestConfig reqConfig = RequestConfig.custom()
                .setConnectionRequestTimeout(Timeout.ofSeconds(45))
                .setResponseTimeout(Timeout.ofSeconds(90))
                .build();

        return HttpClients.custom()
                .setConnectionManager(cm)
                .setDefaultRequestConfig(reqConfig)
                .build();
    }
}
