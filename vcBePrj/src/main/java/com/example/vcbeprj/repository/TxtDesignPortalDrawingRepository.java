package com.example.vcbeprj.repository;

import com.example.vcbeprj.domain.DesignPortalDrawing;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class TxtDesignPortalDrawingRepository implements DesignPortalDrawingRepository {
    private static final String PORTAL_TABLE = "DESIGN_PORTAL_MANUAL_DRAWING";

    private final TxtTableRepository repository;

    public TxtDesignPortalDrawingRepository(TxtTableRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<DesignPortalDrawing> findAll() {
        return repository.selectAll(PORTAL_TABLE, DesignPortalDrawing.class);
    }
}
