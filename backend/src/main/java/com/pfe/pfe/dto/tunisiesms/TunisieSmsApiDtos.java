package com.pfe.pfe.dto.tunisiesms;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Modèles conformes à l'API Rest JSON MyStudents (TunisieSMS) — même contrat que le plugin jQuery
 * {@code mystudents.tunisiesms.js} (côté serveur c'est le même POST /api/sms).
 *
 * <p><b>Équivalence plugin jQuery</b> (même compte / même clé d'autorisation) :
 * <ul>
 *   <li>{@code $.tunisiesms('%key%')} → en-tête HTTP {@code Authorization: Bearer %key%}
 *       (voir {@code tunisiesms.api.key})</li>
 *   <li>{@code $.tunisiesms.sender('%sender%')} → champ JSON {@code "sender"} (voir {@code tunisiesms.sender},
 *       libellé exact liste « Expéditeurs » MyStudents, sinon erreur 442)</li>
 *   <li>{@code $.tunisiesms.sms(mobile, texte)} → corps {@code sms:[{mobile, sms, date_envoi}]} (plugin officiel)</li>
 * </ul>
 *
 * <p>Plugin jQuery ({@code mystudents.tunisiesms.js}) : {@code type: 51} et chaque entrée SMS inclut {@code date_envoi} (date du jour {@code yyyy-M-d}).
 * <p>Variante doc « API Rest JSON » : parfois {@code type: 55} sans {@code date_envoi} — voir {@code tunisiesms.api.type}.
 * <p>Format réponse : {@code [{"mobile":"216...","status":200,"message_id":12345}]}
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public final class TunisieSmsApiDtos {

    private TunisieSmsApiDtos() {
    }

    /**
     * Corps d'envoi SMS — POST /api/sms.
     * Authorization: Bearer {clé} dans le header HTTP.
     * Le plugin jQuery utilise {@code type} numérique {@code 51}.
     */
    public record SendRequest(
            Integer type,
            String sender,
            List<SmsItem> sms) {
    }

    /**
     * Un destinataire dans le tableau {@code sms}.
     * Le plugin jQuery envoie aussi {@code date_envoi} (même format que le script : date du jour).
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record SmsItem(
            String mobile,
            String sms,
            @JsonProperty("date_envoi") String dateEnvoi) {

        public SmsItem(String mobile, String sms) {
            this(mobile, sms, null);
        }
    }

    /** Ligne de réponse après envoi. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record SendResultRow(
            String mobile,
            Integer status,
            @JsonProperty("message_id") Long messageId) {
    }

    /** Corps de requête DLR — POST /api/dlr (plugin : {@code type} = 51). */
    public record DlrRequest(
            Integer type,
            List<DlrItem> dlr) {
    }

    public record DlrItem(
            @JsonProperty("message_id") String messageId) {
    }

    /** Ligne de réponse DLR. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record DlrResultRow(
            String dlr,
            String mobile,
            Integer status,
            @JsonProperty("dlr_time") String dlrTime,
            @JsonProperty("message_id") Long messageId) {
    }
}
