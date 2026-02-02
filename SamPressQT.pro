QT += core gui widgets webenginewidgets webchannel serialbus

CONFIG += c++17

TARGET = SamPressQT
TEMPLATE = app

SOURCES += \
    src/cpp/main.cpp \
    src/cpp/mainwindow.cpp \
    src/cpp/bridge/PlcBridge.cpp \
    src/cpp/modbus/ModbusManager.cpp

HEADERS += \
    src/cpp/mainwindow.h \
    src/cpp/bridge/PlcBridge.h \
    src/cpp/modbus/ModbusManager.h

INCLUDEPATH += src/cpp
