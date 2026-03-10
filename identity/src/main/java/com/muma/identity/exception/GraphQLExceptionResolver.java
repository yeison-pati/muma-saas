package com.muma.identity.exception;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.graphql.execution.DataFetcherExceptionResolverAdapter;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.stereotype.Component;

import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import graphql.schema.DataFetchingEnvironment;

@Component
public class GraphQLExceptionResolver extends DataFetcherExceptionResolverAdapter {

    private static final Logger log = LoggerFactory.getLogger(GraphQLExceptionResolver.class);

    @Override
    protected GraphQLError resolveToSingleError(Throwable ex, DataFetchingEnvironment env) {
        log.error("[GraphQL] Error en {}: {}", env.getExecutionStepInfo().getPath(), ex.getMessage(), ex);

        if (ex instanceof ApiException apiEx) {
            return GraphqlErrorBuilder.newError(env)
                    .errorType(toErrorType(apiEx.getCode()))
                    .message(apiEx.getMessage())
                    .extensions(Map.of("code", apiEx.getCode()))
                    .build();
        }

        return GraphqlErrorBuilder.newError(env)
                .errorType(ErrorType.INTERNAL_ERROR)
                .message("Error interno del servidor")
                .extensions(Map.of("code", "INTERNAL_ERROR"))
                .build();
    }

    private static ErrorType toErrorType(String code) {
        return switch (code) {
            case "AUTH_ERROR" -> ErrorType.UNAUTHORIZED;
            case "NOT_FOUND" -> ErrorType.NOT_FOUND;
            case "BAD_REQUEST" -> ErrorType.BAD_REQUEST;
            default -> ErrorType.INTERNAL_ERROR;
        };
    }
}
