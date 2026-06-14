package com.example.vcbeprj.service;

import com.example.vcbeprj.domain.VcRequestObject;
import com.example.vcbeprj.repository.TxtTableRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VcRequestObjectService {
    private static final Logger log = LoggerFactory.getLogger(VcRequestObjectService.class);

    private final TxtTableRepository repository;
    private final VcTableRoutingService routingService;

    public VcRequestObjectService(TxtTableRepository repository, VcTableRoutingService routingService) {
        this.repository = repository;
        this.routingService = routingService;
    }

    public void insertObjects(String fabId, List<VcRequestObject> objects) {
        String table = routingService.tableSet(fabId).objectTable();
        log.info("[SERVICE][OBJECT][INSERT_ALL] business=insertObjects table={} fabId={} insertCount={}", table, fabId, objects.size());
        repository.insertAll(table, objects);
    }

    public List<VcRequestObject> getObjectsByGuid(String fabId, String guid) {
        String table = routingService.tableSet(fabId).objectTable();
        log.info("[SERVICE][OBJECT][SELECT] business=getObjectsByGuid table={} guid={}", table, guid);
        return repository.selectAll(table, VcRequestObject.class).stream()
                .filter(row -> row.guid().equals(guid))
                .toList();
    }

    public List<VcRequestObject> getObjectsByChamber(String fabId, String guid, String chambNmIndexVal) {
        String table = routingService.tableSet(fabId).objectTable();
        log.info("[SERVICE][OBJECT][SELECT] business=getObjectsByChamber table={} guid={} chamber={}", table, guid, chambNmIndexVal);
        return repository.selectAll(table, VcRequestObject.class).stream()
                .filter(row -> row.guid().equals(guid))
                .filter(row -> row.chambNmIndexVal().equals(chambNmIndexVal))
                .toList();
    }

    public void deleteObjectsByGuid(String fabId, String guid) {
        String table = routingService.tableSet(fabId).objectTable();
        log.info("[SERVICE][OBJECT][DELETE] business=deleteObjectsByGuid table={} guid={}", table, guid);
        repository.deleteWhere(table, VcRequestObject.class, row -> row.guid().equals(guid));
    }

    public List<VcRequestObject> buildCalculationInput(String fabId, String guid) {
        log.info("[SERVICE][OBJECT][BUILD_INPUT] business=buildCalculationInput fabId={} guid={}", fabId, guid);
        return getObjectsByGuid(fabId, guid);
    }
}
