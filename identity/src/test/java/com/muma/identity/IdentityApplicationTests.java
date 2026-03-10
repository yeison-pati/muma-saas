package com.muma.identity;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
class IdentityApplicationTests {

	@MockitoBean
    JwtDecoder jwtDecoder;

	@Test
	void contextLoads() {
	}

}
