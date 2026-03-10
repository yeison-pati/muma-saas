package com.muma.catalog.dtos.projects;

import com.muma.catalog.models.Project;

public record ProjectStateUpdate(Project project, boolean becameQuoted) {}
