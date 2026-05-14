package com.pfe.pfe.dto;

/**
 * Code OTP généré et indication si l'API TunisieSMS a accepté l'envoi (status 200 dans le JSON).
 */
public record OtpIssueResult(String code, boolean smsEnvoyeParApi) {
}
