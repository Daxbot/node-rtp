list(APPEND NODE_RTP_SOURCES
    ${CMAKE_CURRENT_LIST_DIR}/addon.cc
    ${CMAKE_CURRENT_LIST_DIR}/app.cc
    ${CMAKE_CURRENT_LIST_DIR}/bye.cc
    ${CMAKE_CURRENT_LIST_DIR}/rr.cc
    ${CMAKE_CURRENT_LIST_DIR}/rtp.cc
    ${CMAKE_CURRENT_LIST_DIR}/sdes.cc
    ${CMAKE_CURRENT_LIST_DIR}/source.cc
    ${CMAKE_CURRENT_LIST_DIR}/sr.cc)

set(NODE_RTP_SOURCES ${NODE_RTP_SOURCES} PARENT_SCOPE)
