package com.pfe.pfe.billing;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Currency;

/**
 * Conversion montant présentation → unité mineure Stripe selon la devise ISO.
 */
public final class StripeMinorAmountUtil {

    private StripeMinorAmountUtil() {
    }

    public static long toMinorUnits(BigDecimal amount, String currencyCode) {
        if (amount == null || amount.signum() < 0) {
            throw new IllegalArgumentException("Montant invalide");
        }
        Currency c = Currency.getInstance(currencyCode.toUpperCase());
        int digits = c.getDefaultFractionDigits();
        if (digits < 0) {
            digits = 2;
        }
        BigDecimal factor = BigDecimal.TEN.pow(digits);
        return amount.multiply(factor).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }
}
