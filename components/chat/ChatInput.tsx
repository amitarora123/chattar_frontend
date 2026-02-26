import { Plus, Send } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

const ChatInput = ({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
}) => {
  return (
    <div className="relative ">
      <Input
        className="rounded-full pl-12  h-12"
        placeholder="Type a message"
        value={value}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit();
        }}
        onChange={(e) => onChange(e.target.value)}
      />
      {value.length > 0 ? (
        <div className="absolute right-1 top-0  items-center h-full flex ">
          <Button
            onClick={() => onSubmit()}
            variant="outline"
            className="  rounded-full"
          >
            {' '}
            <Send />{' '}
          </Button>
        </div>
      ) : null}

      <div className="absolute left-4 top-0 flex items-center justify-center h-full">
        <Plus className="size-5" />
      </div>
    </div>
  );
};

export default ChatInput;
