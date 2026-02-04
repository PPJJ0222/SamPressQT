/**
 * @file 设备作业状态管理
 * @description 管理当前作业、近期作业、设备操作状态
 * @module stores/device/useDeviceJobStore
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { logger } from '@/utils/logger'
import { usePlcStore } from '@/stores/plc/usePlcStore'
import { useSignalsStore } from '@/stores/plc/useSignalsStore'
import { updateJobDuration, getPressJobByHandleIp, listModbusDevice, type ModbusPressJob, type ModbusDevice } from '@/api/modules/job'
import {
  DeviceOperationStatus,
  type CurrentJob,
  type RecentJob,
  type JobSelectionForm,
  type StatusLabelMap
} from '@/types/device'

export const useDeviceJobStore = defineStore('deviceJob', () => {
  const plcStore = usePlcStore()
  const signalsStore = useSignalsStore()

  /** 当前设备操作状态 */
  const operationStatus = ref<DeviceOperationStatus>(DeviceOperationStatus.IDLE)

  /** 当前作业列表 */
  const currentJobs = ref<CurrentJob[]>([])

  /** 近期作业记录 */
  const recentJobs = ref<RecentJob[]>([])

  /** 作业选择表单 */
  const jobSelection = ref<JobSelectionForm>({
    teamId: undefined,
    personnelId: undefined,
    processId: undefined
  })

  /** 数据加载状态 */
  const loading = ref(false)

  /** 各操作按钮的 loading 状态 */
  const actionLoading = ref({
    connect: false,   // 建立通信
    start: false,     // 开始加工
    complete: false,  // 完成加工
    moveIn: false,    // 移入
    moveOut: false    // 移出
  })

  /** Modbus 压机作业列表（从后端获取） */
  const modbusPressJobList = ref<ModbusPressJob[]>([])

  /** Modbus 设备列表（用于获取设备名称） */
  const modbusDeviceList = ref<ModbusDevice[]>([])

  /** 当前设备 ID（从压机作业列表中提取，确保返回字符串类型） */
  const currentDeviceId = computed(() => {
    const deviceId = modbusPressJobList.value.find((job) => job?.deviceId)?.deviceId
    return deviceId ? String(deviceId) : ''
  })

  /** 已锁定的模具号列表（逗号分隔转数组） */
  const lockedMoldCodes = computed(() => {
    const mouldCode = modbusPressJobList.value.find((job) => job?.mouldCode)?.mouldCode
    return mouldCode ? mouldCode.split(',').map((s) => s.trim()).filter(Boolean) : []
  })

  /** 状态标签映射 */
  const statusLabelMap: StatusLabelMap = {
    [DeviceOperationStatus.IDLE]: '待机中',
    [DeviceOperationStatus.CONNECTING]: '连接中',
    [DeviceOperationStatus.CONNECTED]: '已连接',
    [DeviceOperationStatus.PROCESSING]: '加工中',
    [DeviceOperationStatus.COMPLETED]: '已完成',
    [DeviceOperationStatus.ERROR]: '故障'
  }

  /** 当前状态标签 */
  const statusLabel = computed(() => statusLabelMap[operationStatus.value])

  /** 建立通信 */
  async function establishConnection() {
    actionLoading.value.connect = true
    operationStatus.value = DeviceOperationStatus.CONNECTING
    try {
      // 初始化 PLC 桥接
      await plcStore.init()

      // 下发 MES 通信状态信号
      const result = await signalsStore.sendMesCommunicationStatus()
      if (!result.success) {
        operationStatus.value = DeviceOperationStatus.ERROR
        logger.error('MES 通信状态信号下发失败', { message: result.message })
        return
      }

      operationStatus.value = DeviceOperationStatus.CONNECTED
      logger.success('PLC 通信建立成功')
    } catch (error) {
      operationStatus.value = DeviceOperationStatus.ERROR
      logger.error('PLC 通信建立失败', error)
    } finally {
      actionLoading.value.connect = false
    }
  }

  /** 锁定模具（预留接口，待 PLC 通信协议确定后实现） */
  async function lockMold() {
    logger.info('执行锁定模具操作')
  }

  /** 开始加工（预留接口，待业务流程确定后实现） */
  async function startProcessing() {
    actionLoading.value.start = true
    try {
      operationStatus.value = DeviceOperationStatus.PROCESSING
      logger.info('开始加工')
    } finally {
      actionLoading.value.start = false
    }
  }

  /** 完成加工（预留接口，待业务流程确定后实现） */
  async function completeProcessing() {
    actionLoading.value.complete = true
    try {
      operationStatus.value = DeviceOperationStatus.COMPLETED
      logger.info('完成加工')
    } finally {
      actionLoading.value.complete = false
    }
  }

  /** 移入操作（预留接口，待业务流程确定后实现） */
  async function moveIn() {
    actionLoading.value.moveIn = true
    try {
      logger.info('执行移入操作')
    } finally {
      actionLoading.value.moveIn = false
    }
  }

  /** 移出操作（预留接口，待业务流程确定后实现） */
  async function moveOut() {
    actionLoading.value.moveOut = true
    try {
      logger.info('执行移出操作')
    } finally {
      actionLoading.value.moveOut = false
    }
  }

  /**
   * 更新预计时长
   * @param jobId - 作业 ID
   * @param duration - 预计时长（小时）
   */
  async function updateEstimatedDuration(jobId: string | number, duration: number) {
    const index = currentJobs.value.findIndex((j) => j.id === jobId)
    if (index !== -1) {
      // 使用不可变模式更新数组
      currentJobs.value = [
        ...currentJobs.value.slice(0, index),
        { ...currentJobs.value[index], estimatedDuration: duration },
        ...currentJobs.value.slice(index + 1)
      ]
      try {
        await updateJobDuration(jobId, duration)
        logger.debug('更新预计时长成功', { jobId, duration })
      } catch {
        // http.ts 拦截器已统一处理错误提示和日志记录
      }
    }
  }

  /**
   * 获取当前压机作业信息（根据客户端 IP）
   * @description 后端根据请求 IP 自动识别对应的压机设备
   */
  async function fetchPressJobByIp() {
    try {
      const res = await getPressJobByHandleIp()
      modbusPressJobList.value = res.data || []
      logger.debug('压机作业信息加载完成', {
        deviceId: currentDeviceId.value,
        lockedCount: lockedMoldCodes.value.length
      })
    } catch {
      // http.ts 拦截器已统一处理错误提示和日志记录
      modbusPressJobList.value = []
    }
  }

  /** 获取 Modbus 设备列表 */
  async function fetchModbusDeviceList() {
    try {
      const res = await listModbusDevice()
      modbusDeviceList.value = res.data || []
      logger.debug('设备列表加载完成', { count: modbusDeviceList.value.length })
    } catch {
      // http.ts 拦截器已统一处理错误提示和日志记录
      modbusDeviceList.value = []
    }
  }

  /** 初始化加载作业数据 */
  async function initData() {
    loading.value = true
    try {
      // 并行获取压机作业信息和设备列表
      await Promise.all([fetchPressJobByIp(), fetchModbusDeviceList()])
      logger.info('作业数据加载完成')
    } catch {
      // http.ts 拦截器已统一处理错误提示和日志记录
    } finally {
      loading.value = false
    }
  }

  /** 重置作业选择表单 */
  function resetJobSelection() {
    jobSelection.value = {
      teamId: undefined,
      personnelId: undefined,
      processId: undefined
    }
  }

  /**
   * 校验作业选择是否完整
   * @description 检查班组、人员、预选工艺是否已选择
   * @returns 校验结果对象
   */
  function validateJobSelection(): { valid: boolean; message?: string } {
    const { teamId, personnelId, processId } = jobSelection.value

    if (!teamId) {
      return { valid: false, message: '请先选择班组' }
    }
    if (!personnelId) {
      return { valid: false, message: '请先选择人员' }
    }
    if (!processId) {
      return { valid: false, message: '请先选择预选工艺' }
    }

    return { valid: true }
  }

  return {
    operationStatus,
    currentJobs,
    recentJobs,
    jobSelection,
    loading,
    actionLoading,
    modbusPressJobList,
    modbusDeviceList,
    currentDeviceId,
    lockedMoldCodes,
    statusLabel,
    statusLabelMap,
    establishConnection,
    lockMold,
    startProcessing,
    completeProcessing,
    moveIn,
    moveOut,
    updateEstimatedDuration,
    fetchPressJobByIp,
    initData,
    resetJobSelection,
    validateJobSelection
  }
})
