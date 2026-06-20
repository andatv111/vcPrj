package com.example.vcbeprj.service;

import com.example.vcbeprj.domain.VcRequestComponent;
import com.example.vcbeprj.repository.TxtTableRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VcRequestComponentService {
    private static final Logger log = LoggerFactory.getLogger(VcRequestComponentService.class);

    private final TxtTableRepository repository;
    private final VcTableRoutingService routingService;

    public VcRequestComponentService(TxtTableRepository repository, VcTableRoutingService routingService) {
        this.repository = repository;
        this.routingService = routingService;
    }

    public void insertComponents(String fabId, List<VcRequestComponent> components) {
        String table = routingService.tableSet(fabId).componentTable();
        log.info("[SERVICE][COMPONENT][INSERT_ALL] business=insertComponents table={} fabId={} insertCount={}",
                table, fabId, components.size());
        repository.insertAll(table, components);
    }

    public List<VcRequestComponent> getComponentsByGuid(String fabId, String guid) {
        String table = routingService.tableSet(fabId).componentTable();
        log.info("[SERVICE][COMPONENT][SELECT] business=getComponentsByGuid table={} guid={}", table, guid);
        return repository.selectAll(table, VcRequestComponent.class).stream()
                .filter(row -> row.guid().equals(guid))
                .toList();
    }

    public List<VcRequestComponent> getComponentsByChamber(String fabId, String guid, String chamberNmIndexVal) {
        String table = routingService.tableSet(fabId).componentTable();
        log.info("[SERVICE][COMPONENT][SELECT] business=getComponentsByChamber table={} guid={} chamber={}",
                table, guid, chamberNmIndexVal);
        return repository.selectAll(table, VcRequestComponent.class).stream()
                .filter(row -> row.guid().equals(guid))
                .filter(row -> row.chamberNmIndexVal().equals(chamberNmIndexVal))
                .toList();
    }

    public void deleteComponentsByGuid(String fabId, String guid) {
        String table = routingService.tableSet(fabId).componentTable();
        log.info("[SERVICE][COMPONENT][DELETE] business=deleteComponentsByGuid table={} guid={}", table, guid);
        repository.deleteWhere(table, VcRequestComponent.class, row -> row.guid().equals(guid));
    }

    public List<VcRequestComponent> buildCalculationInput(String fabId, String guid) {
        log.info("[SERVICE][COMPONENT][BUILD_INPUT] business=buildCalculationInput fabId={} guid={}", fabId, guid);
        return getComponentsByGuid(fabId, guid);
    }
}
