package com.pfe.pfe.dto;

import lombok.Data;


@Data
public class VerifyOtpRequestDTO {
    private String telephone;
    private String codeOtp;
}
