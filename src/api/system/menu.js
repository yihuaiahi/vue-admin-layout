import request from '@/utils/request'

export const getMenuListAPI = () => {
  return request({
    url: '/system/menu/list',
    method: 'GET'
  })
}
