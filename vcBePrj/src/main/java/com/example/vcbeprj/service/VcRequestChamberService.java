package com.example.vcbeprj.service;

import com.example.vcbeprj.domain.VcRequestChamber;
import com.example.vcbeprj.repository.TxtTableRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VcRequestChamberService {
    private static final Logger log = LoggerFactory.getLogger(VcRequestChamberService.class);

    private final TxtTableRepository repository;
    private final VcTableRoutingService routingService;

    public VcRequestChamberService(TxtTableRepository repository, VcTableRoutingService routingService) {
        this.repository = repository;
        this.routingService = routingService;
    }

    public void insertChamberResults(String fabId, List<VcRequestChamber> chambers) {
        String table = routingService.tableSet(fabId).chamberTable();
        log.info("[SERVICE][CHAMBER][INSERT_ALL] business=insertChamberResults table={} fabId={} insertCount={}", table, fabId, chambers.size());
        repository.insertAll(table, chambers);
    }

    public List<VcRequestChamber> getChamberResults(String fabId, String guid) {
        String table = routingService.tableSet(fabId).chamberTable();
        log.info("[SERVICE][CHAMBER][SELECT] business=getChamberResults table={} guid={}", table, guid);
        return repository.selectAll(table, VcRequestChamber.class).stream()
                .filter(row -> row.guid().equals(guid))
                .toList();
    }

    public List<VcRequestChamber> getChamberTrend(String fabId, String chamberId) {
        String table = routingService.tableSet(fabId).chamberTable();
        log.info("[SERVICE][CHAMBER][SELECT] business=getChamberTrend table={} chamberId={}", table, chamberId);
        return repository.selectAll(table, VcRequestChamber.class).stream()
                .filter(row -> row.chamberId().equals(chamberId))
                .toList();
    }

    public void deleteChambersByGuid(String fabId, String guid) {
        String table = routingService.tableSet(fabId).chamberTable();
        log.info("[SERVICE][CHAMBER][DELETE] business=deleteChambersByGuid table={} guid={}", table, guid);
        repository.deleteWhere(table, VcRequestChamber.class, row -> row.guid().equals(guid));
    }
}
