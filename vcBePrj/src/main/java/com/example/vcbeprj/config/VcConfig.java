package com.example.vcbeprj.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

@Configuration
@EnableConfigurationProperties(MockDbProperties.class)
public class VcConfig {
    @Bean
    public PlatformTransactionManager transactionManager() {
        return new MockFileTransactionManager();
    }
}
