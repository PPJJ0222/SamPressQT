<script setup lang="ts">
/**
 * @file 操作手册页面
 * @description 压机工时反馈操作手册，指导操作员完成作业流程
 */
</script>

<template>
  <div class="p-4 pb-6 leading-relaxed text-sm text-(--text-primary) overflow-y-auto max-h-[calc(100vh-120px)]">
    <h2 class="mb-3 text-lg font-semibold">压机工时反馈操作手册</h2>

    <ol class="pl-5 list-decimal space-y-3">
      <!-- 作业班组 -->
      <li>
        <strong class="inline-block mb-1">
          ❶ 作业班组
          <span class="inline-block ml-1.5 px-1.5 py-0.5 text-xs rounded-full align-middle text-white bg-red-600">必选</span>
        </strong>
        <ul class="m-0 pl-5 list-disc">
          <li>选择当前作业班组；变更后会自动刷新"操作员""工艺"。</li>
        </ul>
      </li>

      <!-- 操作员 -->
      <li>
        <strong class="inline-block mb-1">
          ❷ 操作员
          <span class="inline-block ml-1.5 px-1.5 py-0.5 text-xs rounded-full align-middle text-white bg-red-600">必选</span>
        </strong>
        <ul class="m-0 pl-5 list-disc">
          <li>选择实际操作人员；班组与操作员为必选项。</li>
        </ul>
      </li>

      <!-- 工艺 -->
      <li>
        <strong class="inline-block mb-1">
          ❸ 工艺
          <span class="inline-block ml-1.5 px-1.5 py-0.5 text-xs rounded-full align-middle text-white bg-red-600">必选</span>
        </strong>
        <ul class="m-0 pl-5 list-disc">
          <li>选择本次作业标准工艺；影响锁模与加工参数记录。</li>
        </ul>
      </li>

      <!-- 建立通信 -->
      <li>
        <strong class="inline-block mb-1">
          建立通信 (异常情况可用,如压机断电)
          <span class="inline-block ml-1.5 px-1.5 py-0.5 text-xs rounded-full align-middle text-white bg-orange-500">重要</span>
        </strong>
        <ul class="m-0 pl-5 list-disc">
          <li>点击"建立通信"初始化与设备的通讯,并对压机上电</li>
        </ul>
      </li>

      <!-- 锁定模具 -->
      <li>
        <strong class="inline-block mb-1">
          ❹ 锁定模具
          <span class="inline-block ml-1.5 px-1.5 py-0.5 text-xs rounded-full align-middle text-white bg-blue-600">关键步骤</span>
        </strong>
        <ul class="m-0 pl-5 list-disc">
          <li>打开锁模窗口后，完成以下步骤：</li>
        </ul>

        <!-- 锁模子步骤 -->
        <ol class="pl-5 list-decimal mt-2 space-y-2">
          <li>
            <strong class="inline-block mb-1">
              ❺ 项目号
              <span class="inline-block ml-1.5 px-1.5 py-0.5 text-xs rounded-full align-middle text-white bg-red-600">必选</span>
            </strong>
            <ul class="m-0 pl-5 list-disc">
              <li>支持远程搜索与选择项目号；变更后需重新选择模具号。</li>
            </ul>
          </li>

          <li>
            <strong class="inline-block mb-1">
              ❻ 模具号
              <span class="inline-block ml-1.5 px-1.5 py-0.5 text-xs rounded-full align-middle text-white bg-red-600">必选</span>
            </strong>
            <ul class="m-0 pl-5 list-disc">
              <li>支持远程搜索与选择模具号。</li>
            </ul>
          </li>

          <li>
            <strong class="inline-block mb-1">❼ 搜索</strong>
            <ul class="m-0 pl-5 list-disc">
              <li>按已选"项目号/模具号"检索可锁定的模具清单。</li>
            </ul>
          </li>

          <li>
            <strong class="inline-block mb-1">
              ❽ 批量校验
              <span class="inline-block ml-1.5 px-1.5 py-0.5 text-xs rounded-full align-middle text-white bg-red-600">必选</span>
            </strong>
            <ul class="m-0 pl-5 list-disc">
              <li>对当前勾选的模具进行可锁定校验；校验结果见"校验结果"列。</li>
              <li>选择上限= 5 套（含已锁定数量），超过将提示并阻止。</li>
            </ul>
          </li>

          <li>
            <strong class="inline-block mb-1">
              ❾ 选择制造令号
              <span class="inline-block ml-1.5 px-1.5 py-0.5 text-xs rounded-full align-middle text-white bg-red-600">必填</span>
            </strong>
            <ul class="m-0 pl-5 list-disc">
              <li>为每条选中记录选择制造令号，必填。</li>
            </ul>
          </li>

          <li>
            <strong class="inline-block mb-1">
              ❿ 选择工艺
              <span class="inline-block ml-1.5 px-1.5 py-0.5 text-xs rounded-full align-middle text-white bg-red-600">必填</span>
            </strong>
            <ul class="m-0 pl-5 list-disc">
              <li>为每条选中记录选择工艺，必填；默认回填为页面"❸工艺"。</li>
            </ul>
          </li>

          <li>
            <strong class="inline-block mb-1">
              ⓫ 确认锁定
              <span class="inline-block ml-1.5 px-1.5 py-0.5 text-xs rounded-full align-middle text-white bg-green-600">提交</span>
            </strong>
            <ul class="m-0 pl-5 list-disc">
              <li>需满足：通过校验、制造令号与工艺均已选择、且非"作业中"状态。</li>
              <li>确认后写入锁模信息（每台设备最多 5 套）。</li>
            </ul>
          </li>

          <li>
            <strong class="inline-block mb-1">取消锁定</strong>
            <ul class="m-0 pl-5 list-disc">
              <li>关闭锁模窗口并清理已选数据，不提交任何更改。</li>
            </ul>
          </li>
        </ol>
      </li>

      <!-- 开始加工 -->
      <li>
        <strong class="inline-block mb-1">
          ⓬ 开始加工（待加工时可用）
          <span class="inline-block ml-1.5 px-1.5 py-0.5 text-xs rounded-full align-middle text-white bg-blue-600">关键</span>
        </strong>
        <ul class="m-0 pl-5 list-disc">
          <li>点击后进入加工中</li>
          <li>若配置需自动记录参数，将启动"下压计数"轮询；当计数 ≥5 次时自动采集并保存全部信号并提示完成。</li>
        </ul>
      </li>

      <!-- 完成加工 -->
      <li>
        <strong class="inline-block mb-1">
          ⓭ 完成加工（开始加工后可用）
          <span class="inline-block ml-1.5 px-1.5 py-0.5 text-xs rounded-full align-middle text-white bg-green-600">完成</span>
        </strong>
        <ul class="m-0 pl-5 list-disc">
          <li>加工结束后点击，结束当前作业；建议及时操作以保证记录完整。</li>
        </ul>
      </li>

      <!-- 移入/移出 -->
      <li>
        <strong class="inline-block mb-1">移入 / 移出（开始加工后可用）</strong>
        <ul class="m-0 pl-5 list-disc">
          <li>移入：对压机下发允许移入指令；移出：对压机下发允许移出指令；操作前确认安全防护。</li>
        </ul>
      </li>

      <!-- 当前/历史作业 -->
      <li>
        <strong class="inline-block mb-1">当前/历史作业</strong>
        <ul class="m-0 pl-5 list-disc">
          <li>当前作业表格：查看设备作业/状态/信号并可刷新。</li>
          <li>近期作业信息：查看历史记录用于追溯与核对。</li>
        </ul>
      </li>

      <!-- 必备校验与限制 -->
      <li>
        <strong class="inline-block mb-1">
          必备校验与限制
          <span class="inline-block ml-1.5 px-1.5 py-0.5 text-xs rounded-full align-middle text-white bg-orange-500">注意</span>
        </strong>
        <ul class="m-0 pl-5 list-disc">
          <li>必选项：未选"作业班组/操作员/工艺"将无法锁模与加工。</li>
          <li>锁模上限：同一设备最多 5 套；超限将被拦截提示。</li>
          <li>通信前置：未建立通信时读取信号/状态可能异常。</li>
        </ul>
      </li>

      <!-- 异常处理 -->
      <li>
        <strong class="inline-block mb-1">异常处理</strong>
        <ul class="m-0 pl-5 list-disc">
          <li>信号读取失败：刷新浏览器重试；仍失败请联系维护。</li>
          <li>参数未记录：确认是否配置了自动记录，且下压计数达到 5 次。</li>
          <li>锁模失败：检查模具是否"作业中"，并补全制造令号与工艺后重试。</li>
          <li>连接异常：尝试重建通信。</li>
        </ul>
      </li>
    </ol>
  </div>
</template>
