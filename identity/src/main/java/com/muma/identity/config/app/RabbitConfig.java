package com.muma.identity.config.app;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    public static final String EXCHANGE = "system.events";
    public static final String QUEUE = "identity.events";

    @Bean
    TopicExchange exchange() {
        return new TopicExchange(EXCHANGE);
    }

    @Bean
    Queue identityQueue() {
        return QueueBuilder.durable(QUEUE).build();
    }

    @Bean
    Binding projectCreatedBinding(Queue identityQueue, TopicExchange exchange) {
        return BindingBuilder
                .bind(identityQueue)
                .to(exchange)
                .with("project.*");
    }

    @Bean
    Binding productEventsBinding(Queue identityQueue, TopicExchange exchange) {
        return BindingBuilder
                .bind(identityQueue)
                .to(exchange)
                .with("product.*");
    }

    @Bean
    MessageConverter messageConverter() {
        return new JacksonJsonMessageConverter();
    }
}
