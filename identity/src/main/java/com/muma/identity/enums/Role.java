package com.muma.identity.enums;

import java.util.EnumSet;

public enum Role {
    ADMIN,
    SALES,
    QUOTER,
    DESIGNER,
    /** Datos maestros / desarrollo: ve proyectos efectivos, agrega a SAP, marca desarrollado */
    DEVELOPMENT;

    public static String[] usersRoles() {
        return EnumSet.of(QUOTER, SALES, DESIGNER, DEVELOPMENT)
                      .stream()
                      .map(Enum::name)
                      .toArray(String[]::new);
    }
}
