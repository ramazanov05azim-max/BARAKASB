import type {
  CoffeeOrderItemStatus,
  CoffeeOrderStatus,
  CoffeePaymentStatus,
  CoffeePreparationWorkspace,
  CoffeeTableOperationalStatus,
} from './bar-domain';
import type { CoffeeBarOperationError } from './bar-repository-contracts';

export const coffeeBarRu = {
  eyebrow: 'Рабочее пространство',
  title: 'Бар',
  activeEmployee: 'Сотрудник',
  location: 'Локация',
  establishment: 'Заведение',
  newTakeaway: 'Новый заказ навынос',
  tables: 'План столов',
  tableHint: 'Нажмите свободный стол, чтобы открыть заказ.',
  openOrders: 'Открытые заказы',
  readyOrders: 'Готово к выдаче',
  recentIssued: 'Недавно выдано',
  noOpenOrders: 'Открытых заказов пока нет.',
  noIssuedOrders: 'Выданные заказы появятся здесь.',
  order: 'Заказ',
  takeaway: 'Навынос',
  table: 'Стол',
  searchProducts: 'Поиск по меню',
  allCategories: 'Все',
  noProducts: 'Позиции не найдены.',
  add: 'Добавить',
  composition: 'Состав заказа',
  emptyOrder: 'Добавьте хотя бы одну позицию.',
  quantity: 'Количество',
  remove: 'Удалить',
  comment: 'Комментарий',
  commentPlaceholder: 'Например: без сахара',
  modifierNone: 'Без добавки',
  send: 'Отправить в работу',
  cancel: 'Отменить заказ',
  cancelConfirm: 'Отменить этот заказ? Действие будет записано в историю.',
  payment: 'Локальная отметка оплаты',
  paymentNotice: 'Это отметка прототипа, реальная оплата не проводится.',
  issue: 'Выдать заказ',
  preparation: 'Приготовление',
  nextStatus: 'Следующий статус',
  total: 'Итого',
  ruble: '₽',
  loading: 'Загружаем рабочее пространство…',
  accessDenied: 'Нет доступа к рабочему пространству «Бар».',
  retry: 'Повторить',
  selectOrder: 'Выберите стол или открытый заказ.',
  immutableNotice: 'После отправки состав заказа изменять нельзя.',
  routingBar: 'Готовит бар',
  routingKitchen: 'Передано на кухню',
  routingImmediate: 'Готово сразу',
  success: 'Изменения сохранены.',
  error: 'Не удалось выполнить действие.',
  issuedAt: 'Выдан',
  noTables: 'Для выбранной локации столы не настроены. Можно создать заказ навынос.',
} as const;

export const coffeeOrderStatusRu: Record<CoffeeOrderStatus, string> = {
  DRAFT: 'Черновик',
  SENT: 'Отправлен',
  IN_PREPARATION: 'Готовится',
  READY: 'Готов',
  ISSUED: 'Выдан',
  CANCELLED: 'Отменён',
};

export const coffeeOrderItemStatusRu: Record<CoffeeOrderItemStatus, string> = {
  DRAFT: 'Черновик',
  NEW: 'Новый',
  ACCEPTED: 'Принят',
  PREPARING: 'Готовится',
  READY: 'Готов',
  CANCELLED: 'Отменён',
};

export const coffeePaymentStatusRu: Record<CoffeePaymentStatus, string> = {
  UNPAID: 'Не оплачен',
  CASH: 'Наличные',
  CARD: 'Карта',
};

export const coffeeTableStatusRu: Record<CoffeeTableOperationalStatus, string> = {
  FREE: 'Свободен',
  OCCUPIED: 'Занят',
  READY: 'Готов',
  UNPAID: 'Не оплачен',
};

export const coffeePreparationWorkspaceRu: Record<CoffeePreparationWorkspace, string> =
  {
    BAR: coffeeBarRu.routingBar,
    KITCHEN: coffeeBarRu.routingKitchen,
    IMMEDIATE: coffeeBarRu.routingImmediate,
  };

export const coffeeBarErrorRu: Record<CoffeeBarOperationError['code'], string> = {
  ACCESS_DENIED: coffeeBarRu.accessDenied,
  NOT_FOUND: 'Запрошенные данные не найдены.',
  INVALID_OPERATION: 'Это действие недоступно в текущем состоянии заказа.',
  TABLE_OCCUPIED: 'У этого стола уже есть открытый заказ.',
  ORDER_EMPTY: 'Нельзя отправить пустой заказ.',
  ORDER_IMMUTABLE: coffeeBarRu.immutableNotice,
  ITEM_ROUTE_MISMATCH: 'Эта позиция готовится в другом рабочем пространстве.',
  PAYMENT_REQUIRED: 'Перед выдачей отметьте способ оплаты.',
  ORDER_NOT_READY: 'Заказ ещё не готов к выдаче.',
};
