cmake_minimum_required(VERSION 3.16)
project(SamPressQT VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)

# Qt6 路径配置
# 优先使用环境变量 Qt6_DIR，否则使用本地开发路径
if(DEFINED ENV{Qt6_DIR})
    set(CMAKE_PREFIX_PATH $ENV{Qt6_DIR})
elseif(APPLE)
    set(CMAKE_PREFIX_PATH "/Users/PopoY/Qt/6.10.2/macos")
elseif(WIN32)
    # Windows CI 环境由 install-qt-action 自动设置
    # 本地开发可设置 Qt6_DIR 环境变量
endif()

find_package(Qt6 REQUIRED COMPONENTS
    Core
    Gui
    Widgets
    WebEngineWidgets
    WebChannel
    SerialBus
    Network
)

set(SOURCES
    src/cpp/main.cpp
    src/cpp/mainwindow.cpp
    src/cpp/bridge/PlcBridge.cpp
    src/cpp/bridge/LogBridge.cpp
    src/cpp/modbus/ModbusManager.cpp
    src/cpp/modbus/PlcAddressMapper.cpp
    src/cpp/modbus/SignalManager.cpp
    src/cpp/config/ConfigManager.cpp
    src/cpp/log/LogManager.cpp
)

set(HEADERS
    src/cpp/mainwindow.h
    src/cpp/bridge/PlcBridge.h
    src/cpp/bridge/LogBridge.h
    src/cpp/modbus/ModbusManager.h
    src/cpp/modbus/PlcAddressMapper.h
    src/cpp/modbus/SignalManager.h
    src/cpp/config/ConfigManager.h
    src/cpp/log/LogManager.h
)

# Web 前端构建
set(WEB_SOURCE_DIR ${CMAKE_SOURCE_DIR}/src/web)
set(QRC_FILE ${CMAKE_SOURCE_DIR}/web_resources.qrc)

# 添加一个总是执行的目标，确保每次构建都重新生成前端资源
# 解决 Vite hash 文件名导致的增量构建问题
add_custom_target(build_web_resources
    COMMAND ${CMAKE_SOURCE_DIR}/build_web.sh
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    COMMENT "构建 Web 前端并生成资源文件..."
)

add_executable(${PROJECT_NAME} ${SOURCES} ${HEADERS} ${QRC_FILE})

# 确保在编译主程序前完成前端构建
add_dependencies(${PROJECT_NAME} build_web_resources)

target_link_libraries(${PROJECT_NAME} PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Widgets
    Qt6::WebEngineWidgets
    Qt6::WebChannel
    Qt6::SerialBus
    Qt6::Network
)

target_include_directories(${PROJECT_NAME} PRIVATE
    ${CMAKE_SOURCE_DIR}/src/cpp
)

# 启用嵌入资源模式
target_compile_definitions(${PROJECT_NAME} PRIVATE EMBED_WEB_RESOURCES)
