import React, { useEffect, useState } from "react";
import { Checkbox, Modal, Space, Typography } from "antd";

// 실제 공통 조직도 팝업을 연결하기 전까지 화면 흐름 확인에만 사용하는 임시 담당자 목록입니다.
const MOCK_MANAGERS = [
  { empNo: "100001", name: "홍길동", department: "설비기술팀" },
  { empNo: "100002", name: "김대중", department: "공정기술팀" },
  { empNo: "100003", name: "김사랑", department: "장비기술팀" },
  { empNo: "100004", name: "이하늘", department: "생산기술팀" },
];

const OrganizationChartPopup = ({ open, selectedEmpNos = [], onCancel, onConfirm }) => {
  const [checkedEmpNos, setCheckedEmpNos] = useState([]);

  useEffect(() => {
    if (open) setCheckedEmpNos(selectedEmpNos);
  }, [open, selectedEmpNos.join(",")]);

  const handleConfirm = () => {
    onConfirm(MOCK_MANAGERS.filter((manager) => checkedEmpNos.includes(manager.empNo)));
  };

  return (
    <Modal
      title="조직도"
      open={open}
      width={480}
      okText="선택"
      cancelText="취소"
      onOk={handleConfirm}
      onCancel={onCancel}
    >
      <Typography.Paragraph type="secondary">
        임시 조직도입니다. 장비담당자를 여러 명 선택할 수 있습니다.
      </Typography.Paragraph>
      <Checkbox.Group value={checkedEmpNos} onChange={setCheckedEmpNos}>
        <Space direction="vertical">
          {MOCK_MANAGERS.map((manager) => (
            <Checkbox key={manager.empNo} value={manager.empNo}>
              {manager.name} ({manager.empNo}) · {manager.department}
            </Checkbox>
          ))}
        </Space>
      </Checkbox.Group>
    </Modal>
  );
};

export default OrganizationChartPopup;
