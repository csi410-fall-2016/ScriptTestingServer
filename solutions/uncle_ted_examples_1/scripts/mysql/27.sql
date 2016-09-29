/* Query 27 */
/* List all the departments in Faculty and Course. */

SELECT fdept FROM Faculty
UNION
SELECT cdept FROM Course;
