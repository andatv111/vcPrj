package com.example.vcbeprj.service;

import com.example.vcbeprj.domain.VcRequestEquipment;
import com.example.vcbeprj.repository.TxtTableRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class VcRequestEquipmentService {
    private static final Logger log = LoggerFactory.getLogger(VcRequestEquipmentService.class);

    private final TxtTableRepository repository;
    private final VcTableRoutingService routingService;

    public VcRequestEquipmentService(TxtTableRepository repository, VcTableRoutingService routingService) {
        this.repository = repository;
        this.routingService = routingService;
    }

    public void createRequestHeader(VcRequestEquipment equipment) {
        String table = routingService.tableSet(equipment.fabId()).equipmentTable();
        log.info("[SERVICE][EQUIPMENT][INSERT] business=createRequestHeader table={} guid={} fabId={} eqId={} woId={}",
                table, equipment.guid(), equipment.fabId(), equipment.fabEqpId(), equipment.woId());
        repository.insert(table, equipment);
    }

    public void updateSpecYn(String fabId, String guid, String specYn) {
        String table = routingService.tableSet(fabId).equipmentTable();
        log.info("[SERVICE][EQUIPMENT][UPDATE] business=updateSpecYn table={} guid={} specYn={}", table, guid, specYn);
        repository.updateWhere(table, VcRequestEquipment.class, row -> row.guid().equals(guid), row ->
                copy(row, row.prgsStatCd(), specYn, row.docUrl(), row.workStatCd(), row.procYn()));
    }

    public void updateProgressStatus(String fabId, String guid, String prgsStatCd) {
        String table = routingService.tableSet(fabId).equipmentTable();
        log.info("[SERVICE][EQUIPMENT][UPDATE] business=updateProgressStatus table={} guid={} prgsStatCd={}", table, guid, prgsStatCd);
        repository.updateWhere(table, VcRequestEquipment.class, row -> row.guid().equals(guid), row ->
                copy(row, prgsStatCd, row.specYn(), row.docUrl(), row.workStatCd(), row.procYn()));
    }

    public void updateDocUrl(String fabId, String guid, String docUrl) {
        String table = routingService.tableSet(fabId).equipmentTable();
        log.info("[SERVICE][EQUIPMENT][UPDATE] business=updateDocUrl table={} guid={} docUrl={}", table, guid, docUrl);
        repository.updateWhere(table, VcRequestEquipment.class, row -> row.guid().equals(guid), row ->
                copy(row, row.prgsStatCd(), row.specYn(), docUrl, row.workStatCd(), row.procYn()));
    }

    public void finalizeRequest(String fabId, String guid) {
        String table = routingService.tableSet(fabId).equipmentTable();
        log.info("[SERVICE][EQUIPMENT][UPDATE] business=finalizeRequest table={} guid={} prgsStatCd=4 workStatCd=1 procYn=Y", table, guid);
        repository.updateWhere(table, VcRequestEquipment.class, row -> row.guid().equals(guid), row ->
                copy(row, "4", row.specYn(), row.docUrl(), "1", "Y"));
    }

    public void rejectRequest(String fabId, String guid) {
        String table = routingService.tableSet(fabId).equipmentTable();
        log.info("[SERVICE][EQUIPMENT][UPDATE] business=rejectRequest table={} guid={} prgsStatCd=3 workStatCd=-1", table, guid);
        repository.updateWhere(table, VcRequestEquipment.class, row -> row.guid().equals(guid), row ->
                copy(row, "3", row.specYn(), row.docUrl(), "-1", row.procYn()));
    }

    public Optional<VcRequestEquipment> getRequestHeader(String fabId, String guid) {
        String table = routingService.tableSet(fabId).equipmentTable();
        log.info("[SERVICE][EQUIPMENT][SELECT] business=getRequestHeader table={} guid={}", table, guid);
        return repository.selectAll(table, VcRequestEquipment.class).stream()
                .filter(row -> row.guid().equals(guid))
                .findFirst();
    }

    public List<VcRequestEquipment> getRequestHeaders(String fabId) {
        String table = routingService.tableSet(fabId).equipmentTable();
        log.info("[SERVICE][EQUIPMENT][SELECT] business=getRequestHeaders table={} fabId={}", table, fabId);
        return repository.selectAll(table, VcRequestEquipment.class);
    }

    private VcRequestEquipment copy(VcRequestEquipment row, String prgsStatCd, String specYn, String docUrl, String workStatCd, String procYn) {
        return new VcRequestEquipment(
                row.guid(), row.fabId(), row.fabEqpId(), row.woId(), row.buildingId(), row.areaId(), row.dareaId(),
                row.eqpMakerNm(), row.eqpModelNm(), row.dwgGbnNm(), row.verVal(), row.handEntryYn(), row.workEmpno(),
                row.workNm(), row.workTm(), prgsStatCd, row.downloadUrl(), row.fileNm(), row.folderPathVal(), specYn,
                row.convYn(), row.inqYn(), workStatCd, procYn, docUrl, row.regTm(), row.regEmpno(),
                LocalDateTime.now(), row.regEmpno()
        );
    }
}
