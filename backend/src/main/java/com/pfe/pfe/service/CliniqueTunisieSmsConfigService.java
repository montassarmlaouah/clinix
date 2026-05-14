package com.pfe.pfe.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.pfe.pfe.dto.CliniqueSmsOverviewDTO;
import com.pfe.pfe.dto.CliniqueTunisieSmsConfigDTO;
import com.pfe.pfe.dto.CliniqueTunisieSmsUpdateDTO;
import com.pfe.pfe.model.Clinique;
import com.pfe.pfe.repository.CliniqueRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class CliniqueTunisieSmsConfigService {

    private final CliniqueRepository cliniqueRepository;

    /**
     * Liste toutes les cliniques avec statut SMS (super admin uniquement — appel contrôlé).
     */
    public List<CliniqueSmsOverviewDTO> listerVueSmsToutesCliniques() {
        return cliniqueRepository.findAll().stream()
                .map(this::toOverviewDto)
                .collect(Collectors.toList());
    }

    private CliniqueSmsOverviewDTO toOverviewDto(Clinique c) {
        CliniqueTunisieSmsConfigDTO inner = toDto(c);
        return new CliniqueSmsOverviewDTO(
                c.getId(),
                c.getNom(),
                Boolean.TRUE.equals(c.getActif()),
                inner.isAbonnementSmsGratuits(),
                inner.isCleConfiguree(),
                inner.getTunisiesmsSender(),
                inner.getCleMasquee()
        );
    }

    public CliniqueTunisieSmsConfigDTO lireConfiguration(String cliniqueId) {
        Clinique c = cliniqueRepository.findById(cliniqueId)
                .orElseThrow(() -> new IllegalArgumentException("Clinique introuvable"));
        return toDto(c);
    }

    public CliniqueTunisieSmsConfigDTO mettreAJour(String cliniqueId, CliniqueTunisieSmsUpdateDTO dto) {
        Clinique c = cliniqueRepository.findById(cliniqueId)
                .orElseThrow(() -> new IllegalArgumentException("Clinique introuvable"));

        if (dto.getAbonnementSmsGratuits() != null && isSuperAdmin()) {
            c.setAbonnementSmsGratuits(dto.getAbonnementSmsGratuits());
        }
        if (dto.getTunisiesmsSender() != null) {
            c.setTunisiesmsSender(dto.getTunisiesmsSender().trim().isEmpty() ? null : dto.getTunisiesmsSender().trim());
        }
        if (dto.getTunisiesmsApiKey() != null) {
            if (dto.getTunisiesmsApiKey().isEmpty()) {
                c.setTunisiesmsApiKey(null);
            } else {
                if (!Boolean.TRUE.equals(c.getAbonnementSmsGratuits())) {
                    throw new IllegalArgumentException(
                            "Cochez d'abord l'abonnement avec SMS gratuits (crédits inclus) avant d'enregistrer la clé API.");
                }
                c.setTunisiesmsApiKey(dto.getTunisiesmsApiKey().trim());
            }
        }

        if (Boolean.FALSE.equals(c.getAbonnementSmsGratuits())) {
            c.setTunisiesmsApiKey(null);
        }

        cliniqueRepository.save(c);
        return toDto(c);
    }

    private CliniqueTunisieSmsConfigDTO toDto(Clinique c) {
        String key = c.getTunisiesmsApiKey();
        boolean configured = StringUtils.hasText(key);
        String masked = null;
        if (configured && key != null) {
            int n = key.length();
            if (n <= 4) {
                masked = "****";
            } else {
                masked = "************" + key.substring(n - 4);
            }
        }
        return new CliniqueTunisieSmsConfigDTO(
                Boolean.TRUE.equals(c.getAbonnementSmsGratuits()),
                c.getTunisiesmsSender(),
                configured,
                masked
        );
    }

    private boolean isSuperAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        return auth.getAuthorities().stream().anyMatch(a -> "ROLE_SUPER_ADMIN".equals(a.getAuthority()));
    }
}
