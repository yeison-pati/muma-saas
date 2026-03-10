package com.muma.identity.enums;

import java.util.EnumSet;

public enum Role {
    ADMIN,
    SALES,
    QUOTER,
    DESIGNER;

    public static String[] usersRoles() {
        return EnumSet.of(QUOTER, SALES, DESIGNER)
                      .stream()
                      .map(Enum::name)
                      .toArray(String[]::new);
    }
}
