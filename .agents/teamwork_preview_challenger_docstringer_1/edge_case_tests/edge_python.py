import asyncio
from functools import wraps

def my_decorator(func):
    """This creates a basic, pass-through decorator that wraps an existing function. It accepts the original callable and returns a wrapped version that executes the function's logic without adding any pre or post processing effects."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        """This function serves as a simple decorator or wrapper that executes the original decorated function with the provided arguments and returns its result without altering its behavior."""
        return func(*args, **kwargs)
    return wrapper

@my_decorator
async def async_outer_func(x: int) -> int:
    """This function defines and immediately calls a nested function, ultimately returning twice the input value plus one."""
    def inner_nested_func(y: int) -> int:
        """Doubles the given integer input by multiplying it by two."""
        return y * 2
    return inner_nested_func(x) + 1

class OuterClass:
    """A container class demonstrating various Python methods including a static method that returns an immediately executed nested function call and an asynchronous class method."""
    @staticmethod
    def static_method(val: str):
        """Converts an input string to uppercase characters by defining and immediately calling a nested function structure. It serves as a wrapper that returns the capitalized version of the original input string."""
        def deeply_nested():
            """Converts a previously defined string variable named val into its uppercase representation. The function assumes that 'val' holds a string object capable of using the upper() method."""
            return val.upper()
        return deeply_nested()

    @classmethod
    async def async_class_method(cls, num: float):
        """Calculates the square of the provided number using an asynchronous class method signature. The implementation is synchronous and simply returns $num^2$."""
        return num ** 2

def func_with_existing_doc():
    """This is an existing python docstring."""
    return True
