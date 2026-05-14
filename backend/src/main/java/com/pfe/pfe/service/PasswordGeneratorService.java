package com.pfe.pfe.service;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

/**
 * Génère un mot de passe aléatoire fort pour les comptes créés par l’admin (SMS).
 * Contient au moins une majuscule, une minuscule, un chiffre et un caractère spécial ;
 * le reste est complété aléatoirement puis mélangé.
 */
@Service
public class PasswordGeneratorService {

    private static final String UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final String LOWER = "abcdefghijkmnopqrstuvwxyz";
    private static final String DIGITS = "23456789";
    /** Caractères compatibles SMS / saisie mobile (évite espaces et guillemets). */
    private static final String SPECIAL = "!@#$%&*-_+=?";
    private static final String ALL = UPPER + LOWER + DIGITS + SPECIAL;

    /** Longueur par défaut (inscription / admin / personnel). */
    private static final int DEFAULT_LENGTH = 12;
    private static final int MIN_LENGTH = 10;

    public String generate() {
        return generate(DEFAULT_LENGTH);
    }

    /**
     * @param totalLength longueur finale (minimum 10)
     */
    public String generate(int totalLength) {
        int len = Math.max(MIN_LENGTH, totalLength);
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(len);
        sb.append(UPPER.charAt(random.nextInt(UPPER.length())));
        sb.append(LOWER.charAt(random.nextInt(LOWER.length())));
        sb.append(DIGITS.charAt(random.nextInt(DIGITS.length())));
        sb.append(SPECIAL.charAt(random.nextInt(SPECIAL.length())));
        for (int i = 4; i < len; i++) {
            sb.append(ALL.charAt(random.nextInt(ALL.length())));
        }
        List<Character> chars = new ArrayList<>();
        for (char c : sb.toString().toCharArray()) {
            chars.add(c);
        }
        Collections.shuffle(chars, random);
        return chars.stream().map(String::valueOf).collect(Collectors.joining());
    }
}
