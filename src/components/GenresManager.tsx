import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { toast } from 'sonner'
import AddButton from './AddButton'

export function GenresManager() {
	const genres = useQuery(api.genres.list)
	const createGenre = useMutation(api.genres.create)
	const deleteGenre = useMutation(api.genres.remove)

	const [newGenreName, setNewGenreName] = useState('')

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!newGenreName.trim()) return

		try {
			await createGenre({ name: newGenreName.trim() })
			toast.success('жанр добавлен')
			setNewGenreName('')
		} catch (error) {
			console.log(error)
			toast.error('не удалось добавить жанр. возможно, он уже существует')
		}
	}

	const handleDelete = async (id: Id<'genres'>) => {
		if (confirm('вы уверены, что хотите удалить этот жанр?')) {
			try {
				await deleteGenre({ id })
				toast.success('жанр удален')
			} catch (error) {
				console.log(error)
				toast.error('не удалось удалить жанр')
			}
		}
	}

	if (!genres) {
		return <div className='p-6'>загрузка жанров...</div>
	}

	return (
		<div className='p-6'>
			<div className='mb-6'>
				<h2 className='text-xl font-semibold mb-4 pl-4'>жанры</h2>

				<form onSubmit={handleSubmit} className='flex gap-2 mb-6'>
					<input
						type='text'
						value={newGenreName}
						onChange={(e) => setNewGenreName(e.target.value)}
						placeholder='новый жанр'
						className='flex-1 px-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
					/>
					<AddButton
						type='submit'
						disabled={!newGenreName}
            className='opacity-0'
						// className={`${!!newGenreName.length ? 'opacity-30' : ''}`}
					/>
				</form>
			</div>

			<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
				{genres.map((genre) => (
					<div
						key={genre._id}
						className='flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md'
					>
						<span className='text-sm font-medium'>{genre.name}</span>
						<button
							onClick={() => handleDelete(genre._id)}
							className='text-red-600 hover:text-red-800 text-sm ml-2'
						>
							×
						</button>
					</div>
				))}
				{genres.length === 0 && (
					<div className='col-span-full'>
						<p className='text-gray-500 text-center py-8'>жанры не найдены</p>
					</div>
				)}
			</div>
		</div>
	)
}
