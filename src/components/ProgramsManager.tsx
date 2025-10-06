import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { toast } from 'sonner'
import { Edit, Plus, Trash } from 'lucide-react'
import AddButton from './AddButton'

export function ProgramsManager() {
	const programs = useQuery(api.programs.list)
	const people = useQuery(api.people.list)
	const createProgram = useMutation(api.programs.create)
	const updateProgram = useMutation(api.programs.update)
	const deleteProgram = useMutation(api.programs.remove)

	const [isCreating, setIsCreating] = useState(false)
	const [editingId, setEditingId] = useState<Id<'programs'> | null>(null)
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		hostId: '',
	})

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		try {
			if (editingId) {
				await updateProgram({
					id: editingId,
					name: formData.name,
					description: formData.description || undefined,
					hostId: formData.hostId
						? (formData.hostId as Id<'people'>)
						: undefined,
				})
				toast.success('передача обновлена')
				setEditingId(null)
				setIsCreating(false)
			} else {
				await createProgram({
					name: formData.name,
					description: formData.description || undefined,
					hostId: formData.hostId
						? (formData.hostId as Id<'people'>)
						: undefined,
				})
				toast.success('передача создана успешно')
				setIsCreating(false)
			}
			setFormData({ name: '', description: '', hostId: '' })
		} catch (error) {
			console.log(error)
			toast.error('не удалось сохранить передачу')
		}
	}

	const handleEdit = (program: any) => {
		setEditingId(program._id)
		setFormData({
			name: program.name,
			description: program.description || '',
			hostId: program.hostId || '',
		})
		setIsCreating(true)
	}

	const handleDelete = async (id: Id<'programs'>) => {
		if (confirm('вы уверены, что хотите удалить эту передачу?')) {
			try {
				await deleteProgram({ id })
				toast.success('передача удалена')
			} catch (error) {
				console.log(error)
				toast.error('не удалось удалить передачу')
			}
		}
	}

	const handleCancel = () => {
		setIsCreating(false)
		setEditingId(null)
		setFormData({ name: '', description: '', hostId: '' })
	}

	if (!programs || !people) {
		return <div className='p-6'>загрузка передач...</div>
	}

	return (
		<div className='p-6'>
			<div className='flex justify-between items-center mb-6'>
				<h2 className='text-xl font-semibold pl-4'>передачи</h2>
				{!isCreating && <AddButton onClick={() => setIsCreating(true)} />}
			</div>
			{isCreating && (
				<div className='mb-6 p-4 border rounded-lg bg-gray-50'>
					<h3 className='text-lg font-medium mb-4'>
						{editingId ? 'редактор' : 'новая передача'}
					</h3>
					<form onSubmit={handleSubmit} className='space-y-4'>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								название *
							</label>
							<input
								type='text'
								required
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								постоянный ведущий
							</label>
							<select
								value={formData.hostId}
								onChange={(e) =>
									setFormData({ ...formData, hostId: e.target.value })
								}
								className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
							>
								<option value=''>выберите ведущего (необязательно)</option>
								{people.map((person) => (
									<option key={person._id} value={person._id}>
										{person.name}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								описание
							</label>
							<textarea
								value={formData.description}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
								rows={3}
								className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
							/>
						</div>
						<div className='flex space-x-2'>
							<button
								type='submit'
								className='bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover'
							>
								{editingId ? 'обновить' : 'создать'}
							</button>
							<button
								type='button'
								onClick={handleCancel}
								className='px-4 py-2 rounded bg-white text-secondary border border-gray-200 font-semibold hover:bg-gray-50 hover:text-secondary-hover transition-colors shadow-sm hover:shadow'
							>
								отмена
							</button>
						</div>
					</form>
				</div>
			)}

			<div className='space-y-4'>
				{programs.map((program) => (
					<div key={program._id} className='border rounded-lg p-4'>
						<div className='flex justify-between items-start'>
							<div className='flex-1'>
								<h3 className='text-lg font-medium'>{program.name}</h3>
								{program.host && (
									<p className='text-gray-600 mt-1'>
										ведущий: {program.host.name}
									</p>
								)}
								{program.description && (
									<p className='text-gray-600 mt-1'>{program.description}</p>
								)}
								<p className='text-sm text-gray-500 mt-2'>
									создано:{' '}
									{new Date(program._creationTime).toLocaleDateString('ru-RU')}
								</p>
							</div>
							<div className='flex space-x-3 ml-4'>
								<button
									onClick={() => handleEdit(program)}
									className='text-primary hover:text-primary-hover/80'
								>
									<Edit />
								</button>
								<button
									onClick={() => handleDelete(program._id)}
									className='text-red-600 hover:text-red-800'
								>
									<Trash />
								</button>
							</div>
						</div>
					</div>
				))}
				{programs.length === 0 && (
					<p className='text-gray-500 text-center py-8'>
						Программы не найдены. Создайте свою первую программу!
					</p>
				)}
			</div>
		</div>
	)
}
