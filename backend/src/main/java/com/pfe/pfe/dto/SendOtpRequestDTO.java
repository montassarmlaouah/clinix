package com.pfe.pfe.dto;

import lombok.Data;

/**
 * DTO pour envoyer un code OTP
 */
@Data
public class SendOtpRequestDTO {
    private String telephone;
}
