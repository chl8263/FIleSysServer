package com.ewan.rfcm.global.security.handler;

import com.ewan.rfcm.global.constant.UserConnection;
import com.ewan.rfcm.global.security.token.JwtPostProcessingToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InvalidObjectException;

@Component
public class JwtAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationSuccessHandler.class);

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, FilterChain chain, Authentication authentication) throws IOException, ServletException {
        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
        securityContext.setAuthentication(authentication);
        SecurityContextHolder.setContext(securityContext);

        JwtPostProcessingToken token = (JwtPostProcessingToken) authentication;

        // s: validation
        String userId = token.getUserId();
        String uidPayload = request.getHeader("Uid");

        if(UserConnection.userConnections.containsKey(userId) && UserConnection.userConnections.get(userId).equals(uidPayload)) {
            chain.doFilter(request, response);  //Run chain which remain on security filter}
        }else {
            //log.error("Invalid token");
            throw new InvalidObjectException("Invalid token");
        }
        // e: validation
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {

    }
}
