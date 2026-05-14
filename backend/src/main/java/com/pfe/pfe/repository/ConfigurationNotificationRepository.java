package com.pfe.pfe.repository;

import com.pfe.pfe.model.ConfigurationNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ConfigurationNotificationRepository extends JpaRepository<ConfigurationNotification, String> {
    Optional<ConfigurationNotification> findByUserId(String userId);
}
