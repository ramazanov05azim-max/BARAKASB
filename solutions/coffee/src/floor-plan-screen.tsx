'use client';

import {
  Circle,
  Coffee,
  Grip,
  Plus,
  RectangleHorizontal,
  Save,
  Square,
  Trash2,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useState,
  type DragEvent,
  type FormEvent,
  type ReactNode,
} from 'react';
import { localCoffeeBarOrderRepository } from './bar-local-repository';
import type {
  CoffeeFloorPlan,
  CoffeeFloorPlanZone,
  CoffeeServiceZoneType,
  CoffeeTable,
  CoffeeTableShape,
} from './domain';
import {
  CoffeeFloorPlanError,
  createCoffeeFloorPlanService,
  type CoffeeFloorPlanService,
} from './floor-plan-service';
import { localCoffeeManagerRepositories } from './repositories';
import { useCoffeeWorkspace } from './workspace-store';

const defaultService = createCoffeeFloorPlanService({
  manager: localCoffeeManagerRepositories,
  orders: localCoffeeBarOrderRepository,
});
const input =
  'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100';
const primary =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-40';
const secondary =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold disabled:opacity-40';

const floorPlanErrors: Record<CoffeeFloorPlanError['code'], string> = {
  ACCESS_DENIED: 'У текущей роли нет разрешения изменять план зала.',
  NOT_FOUND: 'Зона или стол не найдены.',
  INVALID_INPUT: 'Проверьте размеры, положение и обязательные поля.',
  ZONE_NOT_EMPTY: 'Сначала переместите или удалите все столы этой зоны.',
  ACTIVE_ORDER: 'Действие запрещено: со столом связан активный заказ.',
  DUPLICATE_CODE: 'Код стола уже используется в этой локации.',
};
const standardZoneNames: Record<Exclude<CoffeeServiceZoneType, 'OTHER'>, string> = {
  MAIN_HALL: 'Основной зал',
  TERRACE: 'Терраса',
  STREET: 'Улица',
  BAR_COUNTER: 'Барная стойка',
};

function meters(value: number): string {
  return `${(value / 100).toFixed(1)} м`;
}

function tableDimensionLabels(shape: CoffeeTableShape): [string, string] {
  if (shape === 'ROUND') return ['Диаметр (см)', 'Диаметр (см)'];
  if (shape === 'BAR_SEAT') return ['Длина (см)', 'Глубина (см)'];
  return ['Ширина (см)', 'Глубина (см)'];
}

export function CoffeeFloorPlanScreen({
  service = defaultService,
}: {
  service?: CoffeeFloorPlanService;
}) {
  const { projectId, snapshot } = useCoffeeWorkspace();
  const [floorPlan, setFloorPlan] = useState<CoffeeFloorPlan | null>(null);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const [plan, editable] = await Promise.all([
        service.load(projectId),
        service.canEdit(projectId),
      ]);
      setFloorPlan(plan);
      setCanEdit(editable);
      setZoneId((current) =>
        current && plan.zones.some((zone) => zone.id === current)
          ? current
          : (plan.zones[0]?.id ?? null),
      );
    } catch {
      setMessage('Не удалось загрузить план зала.');
    }
  }, [projectId, service]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void reload(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [reload]);

  async function run(operation: () => Promise<CoffeeFloorPlan>): Promise<void> {
    setBusy(true);
    setMessage(null);
    try {
      const next = await operation();
      setFloorPlan(next);
      setMessage('Сохранено');
    } catch (error) {
      setMessage(
        error instanceof CoffeeFloorPlanError
          ? floorPlanErrors[error.code]
          : 'Не удалось сохранить изменения.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (!floorPlan) {
    return <p className="rounded-3xl bg-white p-8 text-center">Загружаем план зала…</p>;
  }

  if (!snapshot) {
    return <p className="rounded-3xl bg-white p-8 text-center">Загружаем проект…</p>;
  }
  const locations = snapshot.locations.filter(
    (location) => location.status === 'active',
  );
  const locationId =
    floorPlan.zones.find((zone) => zone.id === zoneId)?.locationId ??
    snapshot.project.defaultLocationId ??
    locations[0]?.id ??
    '';
  const zones = floorPlan.zones
    .filter((zone) => zone.locationId === locationId)
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const zone = zones.find((candidate) => candidate.id === zoneId) ?? zones[0];
  const tables = floorPlan.tables.filter((table) => table.zoneId === zone?.id);
  const selectedTable = floorPlan.tables.find((table) => table.id === selectedTableId);

  function dropTable(event: DragEvent<HTMLDivElement>): void {
    if (!zone || !canEdit) return;
    event.preventDefault();
    const tableId = event.dataTransfer.getData('text/table-id');
    const table = floorPlan!.tables.find((candidate) => candidate.id === tableId);
    if (!table) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(
        zone.canvasWidth - table.width,
        ((event.clientX - rect.left) / rect.width) * zone.canvasWidth - table.width / 2,
      ),
    );
    const y = Math.max(
      0,
      Math.min(
        zone.canvasHeight - table.height,
        ((event.clientY - rect.top) / rect.height) * zone.canvasHeight -
          table.height / 2,
      ),
    );
    void run(() =>
      service.updateTable(projectId, table.id, {
        positionX: Math.round(x),
        positionY: Math.round(y),
      }),
    );
  }

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">
            Управление залом
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-.04em]">План зала</h1>
          <p className="mt-2 text-slate-500">
            Настройте зоны, расположение и вместимость столов.
          </p>
        </div>
        {message && (
          <span
            role="status"
            className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
          >
            {message}
          </span>
        )}
      </div>

      {!canEdit && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          План доступен только для просмотра.
        </div>
      )}

      <div className="grid gap-4 2xl:grid-cols-[220px_minmax(500px,1fr)_300px]">
        <aside className="rounded-3xl border border-white bg-white/90 p-4 shadow-lg shadow-blue-950/5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Зоны</h2>
            <span className="text-xs text-slate-400">{zones.length}</span>
          </div>
          <div className="mt-3 space-y-2">
            {zones.map((candidate) => (
              <button
                key={candidate.id}
                className={`w-full rounded-xl px-3 py-3 text-left text-sm font-semibold ${candidate.id === zone?.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700'}`}
                onClick={() => {
                  setZoneId(candidate.id);
                  setSelectedTableId(null);
                }}
              >
                {candidate.name}
                {!candidate.active && (
                  <span className="block text-[10px] opacity-70">Отключена</span>
                )}
              </button>
            ))}
          </div>
          {canEdit && locationId && (
            <ZoneForm
              busy={busy}
              onCreate={(value, zoneType) =>
                run(() =>
                  service.createZone(projectId, {
                    locationId,
                    name: value,
                    zoneType,
                    canvasWidth: 800,
                    canvasHeight: 500,
                    active: true,
                  }),
                )
              }
            />
          )}
          {zone && canEdit && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <ZoneEditor
                key={zone.id}
                zone={zone}
                busy={busy}
                onSave={(values) =>
                  run(() => service.updateZone(projectId, zone.id, values))
                }
              />
              <button
                className="mt-4 text-xs font-semibold text-rose-600"
                disabled={busy}
                onClick={() => {
                  if (window.confirm('Удалить пустую зону?')) {
                    void run(() => service.deleteZone(projectId, zone.id));
                  }
                }}
              >
                Удалить текущую зону
              </button>
            </div>
          )}
        </aside>

        <div className="rounded-3xl border border-white bg-white/90 p-4 shadow-lg shadow-blue-950/5">
          {zone ? (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{zone.name}</h2>
                  <p className="text-xs text-slate-500">
                    {meters(zone.canvasWidth)} × {meters(zone.canvasHeight)}
                  </p>
                </div>
                {canEdit && (
                  <button
                    className={secondary}
                    disabled={busy}
                    onClick={() =>
                      void run(() =>
                        service.updateZone(projectId, zone.id, {
                          active: !zone.active,
                        }),
                      )
                    }
                  >
                    {zone.active ? 'Отключить' : 'Включить'}
                  </button>
                )}
              </div>
              <div
                className="relative min-h-[420px] overflow-hidden rounded-2xl border border-blue-100 bg-[linear-gradient(rgba(59,130,246,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,.06)_1px,transparent_1px)] bg-[size:24px_24px]"
                style={{ aspectRatio: `${zone.canvasWidth}/${zone.canvasHeight}` }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={dropTable}
              >
                {tables.map((table) => (
                  <button
                    key={table.id}
                    draggable={canEdit}
                    onDragStart={(event) =>
                      event.dataTransfer.setData('text/table-id', table.id)
                    }
                    onClick={() => setSelectedTableId(table.id)}
                    style={{
                      left: `${(table.positionX / zone.canvasWidth) * 100}%`,
                      top: `${(table.positionY / zone.canvasHeight) * 100}%`,
                      width: `${(table.width / zone.canvasWidth) * 100}%`,
                      height: `${(table.height / zone.canvasHeight) * 100}%`,
                      transform: `rotate(${table.rotation}deg)`,
                      borderRadius:
                        table.shape === 'ROUND' || table.shape === 'BAR_SEAT'
                          ? '999px'
                          : table.shape === 'SQUARE'
                            ? '16px'
                            : '12px',
                    }}
                    className={`absolute grid min-h-12 place-items-center border bg-white p-1 text-xs font-bold shadow-md ${table.id === selectedTableId ? 'border-blue-600 ring-4 ring-blue-100' : 'border-slate-200'} ${table.status !== 'active' ? 'opacity-45' : ''}`}
                  >
                    <Grip className="size-3 text-slate-400" />
                    <span>{table.name}</span>
                    <span className="font-normal">{table.seatCount} мест</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="grid min-h-[420px] place-items-center text-sm text-slate-500">
              Создайте первую зону.
            </div>
          )}
        </div>

        <aside className="rounded-3xl border border-white bg-white/90 p-4 shadow-lg shadow-blue-950/5">
          {zone && canEdit && !selectedTable ? (
            <TableForm
              zone={zone}
              busy={busy}
              sequence={floorPlan.tables.length + 1}
              onSubmit={(values) => run(() => service.createTable(projectId, values))}
            />
          ) : selectedTable ? (
            <TableEditor
              key={selectedTable.id}
              table={selectedTable}
              zone={zone!}
              canEdit={canEdit}
              busy={busy}
              onSave={(values) =>
                run(() => service.updateTable(projectId, selectedTable.id, values))
              }
              onDelete={() => {
                if (window.confirm('Удалить этот стол?')) {
                  void run(() => service.deleteTable(projectId, selectedTable.id));
                  setSelectedTableId(null);
                }
              }}
            />
          ) : (
            <p className="text-sm text-slate-500">Выберите стол или создайте зону.</p>
          )}
        </aside>
      </div>
    </section>
  );
}

function ZoneForm({
  busy,
  onCreate,
}: {
  busy: boolean;
  onCreate: (name: string, zoneType: CoffeeServiceZoneType) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [zoneType, setZoneType] = useState<CoffeeServiceZoneType>('MAIN_HALL');
  return (
    <form
      className="mt-4"
      onSubmit={(event) => {
        event.preventDefault();
        const resolvedName =
          zoneType === 'OTHER' ? name.trim() : standardZoneNames[zoneType];
        if (resolvedName) {
          void onCreate(resolvedName, zoneType);
          setName('');
        }
      }}
    >
      <select
        aria-label="Тип зоны"
        className={input}
        value={zoneType}
        onChange={(event) => setZoneType(event.target.value as CoffeeServiceZoneType)}
      >
        <option value="MAIN_HALL">Основной зал</option>
        <option value="TERRACE">Терраса</option>
        <option value="STREET">Улица</option>
        <option value="BAR_COUNTER">Барная стойка</option>
        <option value="OTHER">Другая зона</option>
      </select>
      {zoneType === 'OTHER' && (
        <label className="mt-2 block text-xs font-semibold text-slate-600">
          Название зоны
          <input
            required
            className={`${input} mt-1`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Например: Летняя веранда"
          />
        </label>
      )}
      <button
        className={`${secondary} mt-2 w-full`}
        disabled={busy || (zoneType === 'OTHER' && !name.trim())}
      >
        <Plus className="size-4" /> Добавить зону
      </button>
    </form>
  );
}

function ZoneEditor({
  zone,
  busy,
  onSave,
}: {
  zone: CoffeeFloorPlanZone;
  busy: boolean;
  onSave: (
    values: Partial<Omit<CoffeeFloorPlanZone, 'id' | 'locationId'>>,
  ) => Promise<void>;
}) {
  const [name, setName] = useState(zone.name);
  const [width, setWidth] = useState(zone.canvasWidth / 100);
  const [height, setHeight] = useState(zone.canvasHeight / 100);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSave({
          name,
          canvasWidth: Math.round(width * 100),
          canvasHeight: Math.round(height * 100),
        });
      }}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        Настройки зоны
      </p>
      {zone.zoneType === 'OTHER' ? (
        <label className="mt-2 block text-xs font-semibold text-slate-600">
          Название зоны
          <input
            className={`${input} mt-1`}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
      ) : (
        <p className="mt-2 rounded-xl bg-slate-50 px-3 py-3 text-sm font-semibold">
          {zone.name}
        </p>
      )}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="Ширина (м)">
          <input
            type="number"
            min={3.2}
            max={30}
            step={0.1}
            className={input}
            value={width}
            onChange={(event) => setWidth(Number(event.target.value))}
          />
        </Field>
        <Field label="Высота (м)">
          <input
            type="number"
            min={2.4}
            max={20}
            step={0.1}
            className={input}
            value={height}
            onChange={(event) => setHeight(Number(event.target.value))}
          />
        </Field>
      </div>
      <button className={`${secondary} mt-2 w-full`} disabled={busy || !name.trim()}>
        Сохранить зону
      </button>
    </form>
  );
}

function TableForm({
  zone,
  busy,
  sequence,
  onSubmit,
}: {
  zone: CoffeeFloorPlanZone;
  busy: boolean;
  sequence: number;
  onSubmit: (
    values: Omit<CoffeeTable, 'id' | 'updatedAt' | 'sortOrder'>,
  ) => Promise<void>;
}) {
  const [name, setName] = useState(`Стол ${sequence}`);
  const [code, setCode] = useState(`T-${String(sequence).padStart(2, '0')}`);
  const [shape, setShape] = useState<CoffeeTableShape>('ROUND');
  const [seatCount, setSeatCount] = useState(2);
  const [width, setWidth] = useState(90);
  const [height, setHeight] = useState(90);
  const dimensionLabels = tableDimensionLabels(shape);
  function submit(event: FormEvent): void {
    event.preventDefault();
    void onSubmit({
      locationId: zone.locationId,
      zoneId: zone.id,
      name,
      code,
      shape,
      positionX: 40,
      positionY: 40,
      width,
      height: shape === 'ROUND' ? width : height,
      rotation: 0,
      seatCount,
      status: 'active',
    });
  }
  return (
    <form onSubmit={submit}>
      <h2 className="font-semibold">Новый стол</h2>
      <Field label="Название">
        <input
          className={input}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <Field label="Код">
        <input
          className={input}
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
      </Field>
      <Field label="Форма">
        <select
          className={input}
          value={shape}
          onChange={(event) => {
            const nextShape = event.target.value as CoffeeTableShape;
            setShape(nextShape);
            if (nextShape === 'ROUND' || nextShape === 'SQUARE') {
              setWidth(90);
              setHeight(90);
            } else if (nextShape === 'RECTANGLE') {
              setWidth(160);
              setHeight(80);
            } else {
              setWidth(240);
              setHeight(60);
            }
          }}
        >
          <option value="ROUND">Круглый</option>
          <option value="SQUARE">Квадратный</option>
          <option value="RECTANGLE">Прямоугольный</option>
          <option value="BAR_SEAT">Место у бара</option>
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label={dimensionLabels[0]}>
          <input
            type="number"
            min={40}
            max={500}
            className={input}
            value={width}
            onChange={(event) => setWidth(Number(event.target.value))}
          />
        </Field>
        {shape !== 'ROUND' && (
          <Field label={dimensionLabels[1]}>
            <input
              type="number"
              min={40}
              max={500}
              className={input}
              value={height}
              onChange={(event) => setHeight(Number(event.target.value))}
            />
          </Field>
        )}
      </div>
      <Field label="Количество мест">
        <input
          type="number"
          min={1}
          max={50}
          className={input}
          value={seatCount}
          onChange={(event) => setSeatCount(Number(event.target.value))}
        />
      </Field>
      <button
        className={`${primary} mt-4 w-full`}
        disabled={busy || !name.trim() || !code.trim()}
      >
        <Plus className="size-4" /> Создать стол
      </button>
    </form>
  );
}

function TableEditor({
  table,
  zone,
  canEdit,
  busy,
  onSave,
  onDelete,
}: {
  table: CoffeeTable;
  zone: CoffeeFloorPlanZone;
  canEdit: boolean;
  busy: boolean;
  onSave: (values: Partial<Omit<CoffeeTable, 'id' | 'locationId'>>) => Promise<void>;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(table);
  const dimensionLabels = tableDimensionLabels(draft.shape);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSave(draft);
      }}
    >
      <h2 className="font-semibold">Настройки стола</h2>
      <Field label="Название">
        <input
          disabled={!canEdit}
          className={input}
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        />
      </Field>
      <Field label="Код">
        <input
          disabled={!canEdit}
          className={input}
          value={draft.code}
          onChange={(event) => setDraft({ ...draft, code: event.target.value })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label={dimensionLabels[0]}>
          <input
            type="number"
            min={40}
            max={zone.canvasWidth}
            disabled={!canEdit}
            className={input}
            value={draft.width}
            onChange={(event) =>
              setDraft({
                ...draft,
                width: Number(event.target.value),
                ...(draft.shape === 'ROUND'
                  ? { height: Number(event.target.value) }
                  : {}),
              })
            }
          />
        </Field>
        {draft.shape !== 'ROUND' && (
          <Field label={dimensionLabels[1]}>
            <input
              type="number"
              min={40}
              max={zone.canvasHeight}
              disabled={!canEdit}
              className={input}
              value={draft.height}
              onChange={(event) =>
                setDraft({ ...draft, height: Number(event.target.value) })
              }
            />
          </Field>
        )}
        <Field label="Поворот">
          <input
            type="number"
            min={0}
            max={359}
            disabled={!canEdit}
            className={input}
            value={draft.rotation}
            onChange={(event) =>
              setDraft({ ...draft, rotation: Number(event.target.value) })
            }
          />
        </Field>
        <Field label="Мест">
          <input
            type="number"
            min={1}
            max={50}
            disabled={!canEdit}
            className={input}
            value={draft.seatCount}
            onChange={(event) =>
              setDraft({ ...draft, seatCount: Number(event.target.value) })
            }
          />
        </Field>
      </div>
      {canEdit && (
        <>
          <button className={`${primary} mt-4 w-full`} disabled={busy}>
            <Save className="size-4" /> Сохранить
          </button>
          <button
            type="button"
            className={`${secondary} mt-2 w-full`}
            disabled={busy}
            onClick={() =>
              void onSave({ status: table.status === 'active' ? 'inactive' : 'active' })
            }
          >
            {table.status === 'active' ? 'Отключить стол' : 'Включить стол'}
          </button>
          <button
            type="button"
            className="mt-3 flex w-full items-center justify-center gap-2 text-sm font-semibold text-rose-600"
            disabled={busy}
            onClick={onDelete}
          >
            <Trash2 className="size-4" /> Удалить стол
          </button>
        </>
      )}
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mt-3 block text-xs font-semibold text-slate-600">
      {label}
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

export const coffeeFloorPlanShapeIcons = {
  ROUND: Circle,
  SQUARE: Square,
  RECTANGLE: RectangleHorizontal,
  BAR_SEAT: Coffee,
} as const;
