import { applyMiddleware, combineReducers, createStore } from "redux";
import createSagaMiddleware from "redux-saga";
import { all } from "redux-saga/effects";

import nonBimReducer from "./vc/nonBim/reducer";
import vcCalculatorReducer from "./vc/vcCalculator/reducer";
import vcResultReducer from "./vc/vcResult/reducer";
import nonBimSaga from "../saga/vc/nonBim/vcSimSaga";

const sagaMiddleware = createSagaMiddleware();

// 실제 서비스 구조를 가정해 vc 하위에 기능별 reducer를 묶습니다.
// selector는 이 경로를 우선 사용하므로 reducer 등록 위치가 바뀌면 selector fallback만 조정하면 됩니다.
const rootReducer = combineReducers({
  vc: combineReducers({
    nonBim: nonBimReducer,
    vcCalculator: vcCalculatorReducer,
    vcResult: vcResultReducer,
  }),
});

function* rootSaga() {
  // 현재는 V/C Simulation 관련 saga만 실행하지만, 이후 기능 saga를 all 배열에 추가할 수 있습니다.
  yield all([nonBimSaga()]);
}

export const store = createStore(rootReducer, applyMiddleware(sagaMiddleware));

// store 생성 이후 saga를 실행해야 saga 내부 select가 최신 root state를 읽을 수 있습니다.
sagaMiddleware.run(rootSaga);
