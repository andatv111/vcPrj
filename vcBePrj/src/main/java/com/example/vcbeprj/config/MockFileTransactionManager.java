package com.example.vcbeprj.config;

import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

public class MockFileTransactionManager extends AbstractPlatformTransactionManager {
    @Override
    protected Object doGetTransaction() {
        return new Object();
    }

    @Override
    protected void doBegin(Object transaction, TransactionDefinition definition) {
        // TXT mock DB는 실제 commit/rollback을 지원하지 않습니다. Service transaction 경계 확인용 no-op입니다.
    }

    @Override
    protected void doCommit(DefaultTransactionStatus status) {
        // no-op
    }

    @Override
    protected void doRollback(DefaultTransactionStatus status) {
        // no-op
    }
}
