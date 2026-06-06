import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { catalogApi } from '../api/catalog'

export interface VehicleSelection {
  make: string
  model: string
  year: number
  license_plate: string
  vin: string
}

interface Props {
  value: VehicleSelection
  onChange: (value: VehicleSelection) => void
}

export default function VehicleSelector({ value, onChange }: Props) {
  const [makeId, setMakeId] = useState<number | ''>('')
  const [modelId, setModelId] = useState<number | ''>('')
  const [generationId, setGenerationId] = useState<number | ''>('')
  const [bodyId, setBodyId] = useState<number | ''>('')

  const { data: makes, isLoading: makesLoading } = useQuery({
    queryKey: ['catalog', 'makes'],
    queryFn: async () => {
      const res = await catalogApi.getMakes()
      return res.data
    },
  })

  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ['catalog', 'models', makeId],
    queryFn: async () => {
      if (!makeId) return []
      const res = await catalogApi.getModels(makeId)
      return res.data
    },
    enabled: !!makeId,
  })

  const { data: generations, isLoading: generationsLoading } = useQuery({
    queryKey: ['catalog', 'generations', modelId],
    queryFn: async () => {
      if (!modelId) return []
      const res = await catalogApi.getGenerations(modelId)
      return res.data
    },
    enabled: !!modelId,
  })

  const { data: bodies, isLoading: bodiesLoading } = useQuery({
    queryKey: ['catalog', 'bodies', generationId],
    queryFn: async () => {
      if (!generationId) return []
      const res = await catalogApi.getBodies(generationId)
      return res.data
    },
    enabled: !!generationId,
  })

  // When a higher-level selection changes, reset downstream selections
  useEffect(() => {
    setModelId('')
    setGenerationId('')
    setBodyId('')
  }, [makeId])

  useEffect(() => {
    setGenerationId('')
    setBodyId('')
  }, [modelId])

  useEffect(() => {
    setBodyId('')
  }, [generationId])

  // Update parent value when catalog selection is complete
  useEffect(() => {
    const makeName = makes?.find((m) => m.id === makeId)?.name || ''
    const modelName = models?.find((m) => m.id === modelId)?.name || ''
    const generation = generations?.find((g) => g.id === generationId)
    const year = generation?.year_from || new Date().getFullYear()

    if (makeName && modelName && generation) {
      onChange({
        ...value,
        make: makeName,
        model: modelName,
        year,
      })
    }
  }, [makeId, modelId, generationId, makes, models, generations, onChange, value])

  const catalogEmpty = !makesLoading && Array.isArray(makes) && makes.length === 0

  const selectCls =
    'w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 disabled:opacity-50'

  return (
    <div className="space-y-3">
      {catalogEmpty && (
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
          Каталог автомобилей недоступен. Введите данные вручную.
        </p>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Марка</label>
        {catalogEmpty ? (
          <input
            value={value.make}
            onChange={(e) => onChange({ ...value, make: e.target.value })}
            className={selectCls}
            placeholder="Например: Toyota"
          />
        ) : (
          <select
            value={makeId}
            onChange={(e) => setMakeId(Number(e.target.value) || '')}
            disabled={makesLoading}
            className={selectCls}
          >
            <option value="">Выберите марку</option>
            {makes?.map((make) => (
              <option key={make.id} value={make.id}>
                {make.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Модель</label>
        {catalogEmpty ? (
          <input
            value={value.model}
            onChange={(e) => onChange({ ...value, model: e.target.value })}
            className={selectCls}
            placeholder="Например: Camry"
          />
        ) : (
          <select
            value={modelId}
            onChange={(e) => setModelId(Number(e.target.value) || '')}
            disabled={!makeId || modelsLoading}
            className={selectCls}
          >
            <option value="">Выберите модель</option>
            {models?.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Поколение</label>
        {catalogEmpty ? (
          <input
            value={value.year ? String(value.year) : ''}
            onChange={(e) => onChange({ ...value, year: Number(e.target.value) || new Date().getFullYear() })}
            className={selectCls}
            placeholder="Год выпуска"
          />
        ) : (
          <select
            value={generationId}
            onChange={(e) => setGenerationId(Number(e.target.value) || '')}
            disabled={!modelId || generationsLoading}
            className={selectCls}
          >
            <option value="">Выберите поколение</option>
            {generations?.map((gen) => (
              <option key={gen.id} value={gen.id}>
                {gen.name} {gen.year_from ? `(${gen.year_from}${gen.year_to ? `–${gen.year_to}` : ''})` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {!catalogEmpty && (
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Кузов</label>
          <select
            value={bodyId}
            onChange={(e) => setBodyId(Number(e.target.value) || '')}
            disabled={!generationId || bodiesLoading}
            className={selectCls}
          >
            <option value="">Выберите кузов</option>
            {bodies?.map((body) => (
              <option key={body.id} value={body.id}>
                {body.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Год</label>
          <input
            type="number"
            value={value.year || ''}
            onChange={(e) => onChange({ ...value, year: Number(e.target.value) })}
            className={selectCls}
            placeholder="Год"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Гос. номер *</label>
          <input
            value={value.license_plate}
            onChange={(e) => onChange({ ...value, license_plate: e.target.value })}
            className={selectCls}
            placeholder="А000АА 77"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">VIN</label>
        <input
          value={value.vin}
          onChange={(e) => onChange({ ...value, vin: e.target.value })}
          className={selectCls}
          placeholder="XTA21100000000000"
        />
      </div>
    </div>
  )
}
