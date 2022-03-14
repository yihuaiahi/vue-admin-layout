<template>
  <div>
    <el-button type="primary" size="default" @click="handleAdd(1)">增加</el-button>
    <el-button type="info" size="default" @click="toggleExpandAll">展开/折叠</el-button>

    <el-table row-key="id" v-if="refreshTable" :data="menuList" :default-expand-all="isExpandAll">
      <el-table-column align="center" label="菜单名称" prop="menuName" />
      <el-table-column align="center" label="图标">
        <template #default="scope">
          <i class="iconfont" :class="scope.row.icon" />
        </template>
      </el-table-column>
      <el-table-column align="center" label="菜单类型" prop="menuType" />
      <el-table-column align="center" label="权限标识" prop="menuCode" />
      <el-table-column align="center" label="路由地址" prop="path" />
      <!-- <el-table-column align="center" label="组件路径" prop="component" width="210" /> -->
      <!-- <el-table-column align="center" label="菜单状态" prop="menuState" :formatter="formateMenuState" /> -->
      <el-table-column align="center" label="排序" prop="orderNum" />
      <el-table-column align="center" label="创建时间" prop="createTime" />
      <el-table-column align="center" label="操作" width="300">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleAdd(2, scope.row)">新增</el-button>
          <el-button size="small" @click="handleUpdate(scope.row)">编辑</el-button>
          <el-button type="danger" size="small" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 对话框 -->
    <el-dialog :title="!menuForm.id ? '添加菜单' : '编辑菜单'" v-model="showModal" width="500px">
      <el-form
        class="menu-form"
        ref="addOrUpdateRef"
        label-width="100px"
        :model="menuForm"
        :rules="menuRules"
      >
        <el-form-item label="菜单类型" prop="menuType">
          <el-radio-group v-model="menuForm.menuType">
            <el-radio :label="1">目录</el-radio>
            <el-radio :label="2">菜单</el-radio>
            <el-radio :label="3">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="父级菜单" prop="parentId">
          <el-cascader
            :options="menuList"
            :props="{ checkStrictly: true, value: 'id', label: 'menuName' }"
            v-model="menuForm.parentId"
            clearable
          />
        </el-form-item>
        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="menuForm.menuName" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item label="菜单图标" prop="icon" v-if="menuForm.menuType !== 3">
          <!-- <el-input v-model="menuForm.icon" placeholder="请输入菜单图标" /> -->
          <IconSelector type="ali" @get="onGetIcon" @clear="onClearIcon" v-model="modelIcon" />
        </el-form-item>
        <el-form-item label="组件路径" prop="component" v-if="menuForm.menuType === 2">
          <el-input v-model="menuForm.component" placeholder="请输入组件路径" />
        </el-form-item>
        <el-form-item label="路由地址" prop="path" v-if="menuForm.menuType === 2">
          <el-input v-model="menuForm.path" placeholder="请输入路由地址" />
        </el-form-item>
        <el-form-item label="权限标识" prop="menuCode" v-if="menuForm.menuType === 3">
          <el-input v-model="menuForm.menuCode" placeholder="请输入权限标识" />
        </el-form-item>
        <el-form-item>
          <template #label>
            <span>
              <el-tooltip content="选择是则会被`keep-alive`缓存，需要匹配组件的`name`和地址保持一致" placement="top">
                <i class="el-icon-question"></i>
              </el-tooltip>是否缓存
            </span>
          </template>
          <el-radio-group v-model="menuForm.isKeep">
            <el-radio label="0">缓存</el-radio>
            <el-radio label="1">不缓存</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <template #label>
            <span>
              <el-tooltip content="选择隐藏则路由将不会出现在侧边栏，但仍然可以访问" placement="top">
                <i class="el-icon-question"></i>
              </el-tooltip>显示状态
            </span>
          </template>
          <el-radio-group v-model="menuForm.isHide">
            <el-radio label="0">显示</el-radio>
            <el-radio label="1">隐藏</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <template #label>
            <span>
              <el-tooltip content="选择是外链则路由地址需要以`http(s)://`开头" placement="top">
                <i class="el-icon-question"></i>
              </el-tooltip>是否外链
            </span>
          </template>
          <el-radio-group v-model="menuForm.isFrame">
            <el-radio label="0">是</el-radio>
            <el-radio label="1">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="menuForm.orderNum" :min="0" />
        </el-form-item>
        <el-form-item label="菜单状态" prop="menuState">
          <el-radio-group v-model="menuForm.menuState">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="2">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span>
          <el-button @click="showModal = false">取 消</el-button>
          <el-button type="primary" @click="handleSubmit">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'
import { getMenuListAPI } from '@/api/system/menu'
import { toTreeData } from '@/utils'
import IconSelector from '@/components/icon-selector/index.vue'

const menuList = ref([])
const showModal = ref(false)
const isExpandAll = ref(false) // 是否展开，默认全部折叠
const refreshTable = ref(true) // 重新渲染表格状态
const addOrUpdateRef = ref(null)
const modelIcon = ref('') // 字体图片
const menuForm = reactive({
  parentId: [null], // 默认null
  menuType: 1,
  menuState: 1,
  orderNum: 0
})
const menuRules = {}

const getMenuList = async () => {
  const result = await getMenuListAPI()
  menuList.value = toTreeData(result.data)
  console.log(menuList.value)
}
getMenuList()

const toTreeRoutes = data => {

}

const handleAdd = (type, row) => {
  showModal.value = true
}

const handleUpdate = () => {

}

const handleDelete = () => {

}

const handleSubmit = () => {

}

const toggleExpandAll = async () => {
  refreshTable.value = false
  isExpandAll.value = !isExpandAll.value
  await nextTick()
  refreshTable.value = true
}

const onGetIcon = value => {
  console.log(value)
}

const onClearIcon = value => {
  console.log(value)
}
</script>

<style lang="scss" scoped>
</style>
