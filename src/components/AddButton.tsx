import { Plus } from 'lucide-react'
import { ButtonHTMLAttributes, FC } from 'react'

const AddButton: FC<ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
	<button
		{...props}
		className='bg-primary text-white md:p-2 p-1 rounded-md hover:bg-primary-hover'
	>
		<div className='flex gap-1 items-center justify-center'>
			<Plus />
			<div className='hidden md:block'>добавить</div>
		</div>
	</button>
)

export default AddButton
