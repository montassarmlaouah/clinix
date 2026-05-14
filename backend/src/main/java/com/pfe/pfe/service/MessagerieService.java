package com.pfe.pfe.service;

import com.pfe.pfe.model.MessageInterne;
import com.pfe.pfe.model.User;
import com.pfe.pfe.repository.MessageInterneRepository;
import com.pfe.pfe.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class MessagerieService {

    private final MessageInterneRepository messageRepository;
    private final UserRepository userRepository;

    public MessageInterne envoyerMessage(String expediteurId, String destinataireId,
                                          String sujet, String contenu,
                                          MessageInterne.PrioriteMessage priorite) {
        User expediteur = userRepository.findById(expediteurId)
                .orElseThrow(() -> new RuntimeException("Expéditeur non trouvé"));
        User destinataire = userRepository.findById(destinataireId)
                .orElseThrow(() -> new RuntimeException("Destinataire non trouvé"));

        MessageInterne message = new MessageInterne();
        message.setExpediteur(expediteur);
        message.setDestinataire(destinataire);
        message.setSujet(sujet);
        message.setContenu(contenu);
        message.setPriorite(priorite != null ? priorite : MessageInterne.PrioriteMessage.NORMALE);
        message.setLu(false);
        message.setDateEnvoi(LocalDateTime.now());

        return messageRepository.save(message);
    }

    public List<MessageInterne> obtenirMessagesRecus(String userId) {
        return messageRepository.findByDestinataireIdOrderByDateEnvoiDesc(userId);
    }

    public List<MessageInterne> obtenirMessagesEnvoyes(String userId) {
        return messageRepository.findByExpediteurIdOrderByDateEnvoiDesc(userId);
    }

    public List<MessageInterne> obtenirMessagesNonLus(String userId) {
        return messageRepository.findByDestinataireIdAndLuFalseOrderByDateEnvoiDesc(userId);
    }

    public long compterMessagesNonLus(String userId) {
        return messageRepository.countByDestinataireIdAndLuFalse(userId);
    }

    public List<MessageInterne> obtenirConversation(String userId, String otherUserId) {
        List<MessageInterne> messages = messageRepository.findConversation(userId, otherUserId);

        messages.stream()
                .filter(m -> m.getDestinataire().getId().equals(userId) && !m.getLu())
                .forEach(m -> {
                    m.setLu(true);
                    m.setDateLecture(LocalDateTime.now());
                });
        messageRepository.saveAll(messages);

        return messages;
    }

    public MessageInterne marquerCommeLu(String messageId, String userId) {
        MessageInterne message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message non trouvé"));

        if (!message.getDestinataire().getId().equals(userId)) {
            throw new RuntimeException("Accès non autorisé à ce message");
        }

        message.setLu(true);
        message.setDateLecture(LocalDateTime.now());
        return messageRepository.save(message);
    }

    public List<Map<String, Object>> obtenirContacts(String userId) {
        List<String> contactIds = messageRepository.findContactIds(userId);

        return contactIds.stream()
                .map(contactId -> {
                    User contact = userRepository.findById(contactId).orElse(null);
                    if (contact == null) return null;
                    long nonLus = messageRepository.findConversation(userId, contactId).stream()
                            .filter(m -> m.getDestinataire().getId().equals(userId) && !m.getLu())
                            .count();
                    return Map.<String, Object>of(
                            "userId", contact.getId(),
                            "nom", contact.getNom(),
                            "prenom", contact.getPrenom(),
                            "nonLus", nonLus
                    );
                })
                .filter(m -> m != null)
                .collect(Collectors.toList());
    }

    public void supprimerMessage(String messageId, String userId) {
        MessageInterne message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message non trouvé"));

        if (!message.getExpediteur().getId().equals(userId) &&
            !message.getDestinataire().getId().equals(userId)) {
            throw new RuntimeException("Accès non autorisé à ce message");
        }

        messageRepository.delete(message);
    }
}
